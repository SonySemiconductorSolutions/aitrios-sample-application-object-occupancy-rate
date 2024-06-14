/* eslint-disable no-undef */

export const calcDecimalPoint = (point: number) => {
  return 10 ** point
}

export default function analyzeInference (resultList: outputResults[], rangeList: deviceRange[], settings: OccupancySettings) {
  if (!settings) {
    return []
  }

  const IMAGESIZE_W = settings.imageWidth
  const IMAGESIZE_H = settings.imageHeight
  const DECIMAL_POINT = calcDecimalPoint(settings.decimalPoint)
  const DECIMAL_MAGNIFICATION = 100 * calcDecimalPoint(settings.decimalPoint)
  const OCCUPANCY_RESOLUTION: number = settings.resolution
  const RESOLUTION_W = Math.floor(IMAGESIZE_W / OCCUPANCY_RESOLUTION)
  const RESOLUTION_H = Math.floor(IMAGESIZE_H / OCCUPANCY_RESOLUTION)

  const occupancyList: oneDeviceOccupancy[] = []

  for (const result of resultList) {
    const range = rangeList.filter(elm => elm.deviceName === result.deviceName)

    if (!range) {
      return
    }

    for (const elm of range) {
      //console.log('deviceName: ' + elm.deviceName + ' shelfName: ' + elm.drawer.shelfName + ' drawerName: ' + elm.drawer.drawerName)
      // 初期化
      const data: oneDeviceOccupancy = { shelfName: elm.drawer.shelfName, drawerName: elm.drawer.drawerName, deviceName: result.deviceName, occupancy: { deviceName: elm.deviceName, occupancy: 0, height: elm.rect.bottom - elm.rect.top, width: elm.rect.right - elm.rect.left }, OccupancyData: [], rectData: [], rangeRect: elm.rect, detectPerson: false }
      for (let i = 0; i < RESOLUTION_H; i++) {
        data.OccupancyData.push(new Array(RESOLUTION_W).fill(0))
      }
      //console.log('range: ' + JSON.stringify(elm.rect))
      // 推論結果とデバイスの判定範囲の矩形に該当する領域に「1」を設定する
      for (const element of Object.entries(result.result.Inferences[0])) {
        const rect = judgeRange(element[1], elm)
        if (((rect.bottom - rect.top) > 0) && ((rect.right - rect.left) > 0)) {
          for (let y = Math.floor(rect.top / OCCUPANCY_RESOLUTION); y <= Math.floor(rect.bottom / OCCUPANCY_RESOLUTION); y++) {
            data.OccupancyData[y].fill(1, Math.floor(rect.left / OCCUPANCY_RESOLUTION), Math.floor(rect.right / OCCUPANCY_RESOLUTION))
          }
          data.rectData.push(rect)
          if (element[1].C === 0) {
            data.detectPerson = true
          }
        }
      }
      // 占有率の算出
      let occupacy: number = 0
      for (let i = 0; i < RESOLUTION_H; i++) {
        occupacy += data.OccupancyData[i].reduce(function (sum, tmp) { return sum + tmp })
      }
      const rangeArea = Math.ceil(((elm.rect.bottom - elm.rect.top) / OCCUPANCY_RESOLUTION) + 1) * (Math.ceil((elm.rect.right - elm.rect.left) / OCCUPANCY_RESOLUTION) + 1)
      data.occupancy.occupancy = Math.floor(occupacy / rangeArea * DECIMAL_MAGNIFICATION) / DECIMAL_POINT
      occupancyList.push(data)
    }
  }

  return occupancyList
}

// 推論結果とデバイスの判定範囲の重複矩形を取得
const judgeRange = (inference: InferencesResult, range: deviceRange) => {
  const rect: rectDeviceRange = { top: 0, left: 0, bottom: 0, right: 0 }
  if (range.rect) {
    // judge left
    // console.log('inference[X]: ' + inference['X'] + 'rect.left: ' + range.rect.left + 'rect.right: ' + range.rect.right)
    if ((inference.X >= range.rect.left) && (inference.X <= range.rect.right)) {
      rect.left = inference.X
    } else if ((inference.X < range.rect.left) && (inference.x > range.rect.left)) {
      rect.left = range.rect.left
    }
    // judge top
    // console.log('inference[Y]: ' + inference['Y'] + 'rect.top: ' + range.rect.top + 'rect.bottom: ' + range.rect.bottom)
    if ((inference.Y >= range.rect.top) && (inference.Y <= range.rect.bottom)) {
      rect.top = inference.Y
    } else if ((inference.Y < range.rect.top) && (inference.y > range.rect.bottom)) {
      rect.top = range.rect.top
    }
    // judge right
    // console.log('inference[x]: ' + inference['x'] + 'rect.left: ' + range.rect.left + 'rect.right: ' + range.rect.right)
    if ((rect.left > 0) && (inference.x <= range.rect.right)) {
      rect.right = inference.x
    } else if ((rect.left > 0) && (inference.x > range.rect.left)) {
      rect.right = range.rect.right
    }
    // judge bottom
    // console.log('inference[y]: ' + inference['y'] + 'rect.top: ' + range.rect.top + 'rect.bottom: ' + range.rect.bottom)
    if ((rect.top > 0) && (inference.y <= range.rect.bottom)) {
      rect.bottom = inference.y
    } else if ((rect.top > 0) && (inference.y > range.rect.bottom)) {
      rect.bottom = range.rect.bottom
    }
  }
  return rect
}
