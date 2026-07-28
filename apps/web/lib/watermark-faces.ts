import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import {
  BLAZEFACE_MODEL_TOPOLOGY,
  BLAZEFACE_WEIGHT_SPECS,
  BLAZEFACE_FORMAT,
  BLAZEFACE_GENERATED_BY,
  BLAZEFACE_CONVERTED_BY,
  BLAZEFACE_WEIGHTS_BASE64,
} from "./models/blazeface-model";

export interface FaceZone {
  cx: number;
  cy: number;
  /** Rayon d'atténuation, déjà multiplié par faceRadiusScale. */
  radius: number;
}

// Modèle chargé une fois par instance de fonction serverless (pas par
// photo) : preparePhoto() traite plusieurs photos en parallèle par
// publication (group-publish.ts), toutes doivent réutiliser le même modèle
// en mémoire plutôt que de le reconstruire depuis les poids à chaque appel.
let modelPromise: Promise<blazeface.BlazeFaceModel> | null = null;

function loadModel(): Promise<blazeface.BlazeFaceModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await tf.setBackend("cpu");
      await tf.ready();

      const weightData = Buffer.from(BLAZEFACE_WEIGHTS_BASE64, "base64");
      const ioHandler = tf.io.fromMemory({
        modelTopology: BLAZEFACE_MODEL_TOPOLOGY,
        weightSpecs: BLAZEFACE_WEIGHT_SPECS,
        weightData: weightData.buffer.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength),
        format: BLAZEFACE_FORMAT,
        generatedBy: BLAZEFACE_GENERATED_BY,
        convertedBy: BLAZEFACE_CONVERTED_BY,
      });
      return blazeface.load({ modelUrl: ioHandler, maxFaces: 24 });
    })();
  }
  return modelPromise;
}

/**
 * Détecte les visages dans l'image déjà décodée (mêmes pixels que ceux
 * utilisés pour le rendu final, donc les coordonnées renvoyées sont
 * directement dans l'espace de l'image de sortie — pas de mise à l'échelle
 * à refaire côté appelant).
 */
export async function detectFaceZones(
  rgb: Buffer,
  width: number,
  height: number,
  channels: number,
  radiusScale: number,
): Promise<FaceZone[]> {
  const model = await loadModel();
  const tensor = tf.tensor3d(new Uint8Array(rgb), [height, width, channels]);
  try {
    const predictions = await model.estimateFaces(tensor, false);
    return predictions.map((p) => {
      const topLeft = p.topLeft as [number, number];
      const bottomRight = p.bottomRight as [number, number];
      const w = bottomRight[0] - topLeft[0];
      const h = bottomRight[1] - topLeft[1];
      const size = Math.max(w, h);
      return {
        cx: topLeft[0] + w / 2,
        cy: topLeft[1] + h / 2,
        radius: radiusScale * (size / 2),
      };
    });
  } finally {
    tensor.dispose();
  }
}
