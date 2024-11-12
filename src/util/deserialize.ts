/* eslint-disable no-undef */
import { flatbuffers } from 'flatbuffers'
import { SmartCamera } from '../util/ObjectdetectionGenerated'

export default function deserialize (inferenceData) {
  // Base64 decode
  let decodedData: Buffer
  if (inferenceData) {
    decodedData = Buffer.from(inferenceData, 'base64')
  } else {
    console.log('not inference result in this data')
    return
  }

  // Deserialize
  const tmp = new flatbuffers.ByteBuffer(decodedData)
  const pplOut = SmartCamera.ObjectDetectionTop.getRootAsObjectDetectionTop(tmp)
  const readObjData = pplOut.perception()
  const resNum = readObjData.objectDetectionListLength()
  // console.log('NumOfDetections:' + String(resNum))

  // generate JSON
  const deserializedInferenceData: outputResult = { Inferences: [{}] }
  for (let i = 0; i < resNum; i++) {
    const objList = readObjData.objectDetectionList(i)
    const unionType = objList.boundingBoxType()
    if (unionType === SmartCamera.BoundingBox.BoundingBox2d) {
      const bbox2d = objList.boundingBox(new SmartCamera.BoundingBox2d())
      const res: Inference = {
        C: Number(objList.classId()),
        P: Number(objList.score()),
        X: Number(bbox2d.left()),
        Y: Number(bbox2d.top()),
        x: Number(bbox2d.right()),
        y: Number(bbox2d.bottom())
      }
      const inferenceKey = String(i + 1)
      deserializedInferenceData.Inferences[0][inferenceKey] = res
    }
  }
  delete deserializedInferenceData.Inferences[0][0]
  return deserializedInferenceData
}
