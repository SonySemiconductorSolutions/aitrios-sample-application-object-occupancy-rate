/* eslint-disable no-unused-vars */

interface drawers {
    shelfName: string
    drawerList: string[]
  }

interface oneDrawer {
    shelfName: string
    drawerName: string
}

interface deviceRelation {
    deviceName: string
    drawer: oneDrawer[]
}

interface rectDeviceRange {
    top: number
    left: number
    bottom: number
    right: number
}

interface deviceRange {
    deviceName: string
    drawer: oneDrawer
    rect: rectDeviceRange
}

interface Occupancy {
    deviceName :string
    height: number
    width: number
    occupancy: number
}

interface oneDeviceOccupancy {
    shelfName: string
    drawerName: string
    deviceName: string
    OccupancyData: number[][]
    rectData: rectDeviceRange[]
    rangeRect: rectDeviceRange
    occupancy: Occupancy
    detectPerson: boolean
}

interface drawerOccupancy {
    shelfName : string
    drawerName: string
    occupancyList: Occupancy[]
    occupancy: number
    bgcolor: string
    detectPerson: boolean
}

type InferencesResult = {
    [prop: string]: any
}

type outputResult = {
    'Inferences': InferencesResult[]
}

type Inference = {
    'C': number,
    'P': number,
    'X': number,
    'Y': number,
    'x': number,
    'y': number
}

interface outputResults {
    deviceName: string
    result: outputResult
}

interface ThreshSetting {
    threshhold: number
    color_red: number
    color_green: number
    color_blue: number
}
interface OccupancySettings {
    isLocalMode: boolean
    pollingInterval: number
    imageHeight: number
    imageWidth: number
    resolution: number
    decimalPoint: number
    threshList: ThreshSetting[]
}
