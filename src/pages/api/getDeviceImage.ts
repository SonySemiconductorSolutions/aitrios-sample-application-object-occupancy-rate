/*
 * Copyright 2022 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import { Client, Config } from 'consoleAccessLibrary'
import { getConsoleAccessLibrarySettings, ConsoleAccessLibrarySettings } from '../../common/config'
import * as fs from 'fs'
import getIsLocalMode from './readModeSettings'
import { format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const PUBLIC_DIRECTORY = './public'
const DEVICEIMAGE_DIRECTORY = PUBLIC_DIRECTORY + '/deviceImage'

// Local Simulate Mode
const readDeviceImageFile = async (deviceName: string) => {
  let readData: string = ''

  const readFileName: string = DEVICEIMAGE_DIRECTORY + '/' + deviceName + '.jpg'

  if (!fs.existsSync(readFileName)) {
    return { image: '' }
  }

  try {
    readData = fs.readFileSync(readFileName, { encoding: 'base64' })
  } catch (error) {
    console.error(error)
    return { image: '' }
  }

  const base64Image = `data:image/jpg;base64,${readData}`

  return { image: base64Image }
}

// Aitorios Connect Mode
// eslint-disable-next-line no-unused-vars
const readDeviceImage = async (deviceName: string) => {
  const connectionInfo: ConsoleAccessLibrarySettings = getConsoleAccessLibrarySettings()
  let config:Config
  try {
    config = new Config(connectionInfo.consoleEndpoint, connectionInfo.portalAuthorizationEndpoint, connectionInfo.clientId, connectionInfo.clientSecret)
  } catch {
    throw new Error('Unable to create instance.')
  }
  const client = await Client.createInstance(config)
  if (!client) {
    throw new Error('Unable to create instance.')
  }

  const imageDirectory = await client.insight?.getImageDirectories(deviceName)
  const latestimagename = imageDirectory.data[0].devices[0].Image.pop()

  let startTime
  let endTime
  try {
    const currentDate = utcToZonedTime(new Date(), 'UTC')
    endTime = format(currentDate.getTime(), 'yyyyMMddHHmm')

    const startDate = new Date(currentDate.getTime() - 1 * 60 * 60 * 1000)
    startTime = format(startDate, 'yyyyMMddHHmm')
  } catch (err) {
    throw new Error(
      'Cannot parse image directory name. Check that the directory name is correct date format.'
    )
  }

  const orderBy = 'DESC'
  const numberOfImages = 1
  const skip = 0

  const imageData = await client.insight?.getImages(deviceName, latestimagename, numberOfImages, skip, orderBy, startTime, endTime)

  let latestImage
  if (imageData.data.total_image_count > 0) {
    latestImage = imageData.data.images[0]
  } else {
    return { image: '' }
  }

  const base64Img = `data:image/jpg;base64,${latestImage.contents}`

  return { image: base64Img }
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }
  if (!req.query.deviceId) {
    res.status(400).json({ message: 'Device ID is not specified.' })
    return
  }

  const isLocalMode = getIsLocalMode()
  if (isLocalMode) {
    // console.log("Local Simulate Mode")
    await readDeviceImageFile(req.query.deviceId.toString())
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        if (error.response) {
          res.status(500).json({ message: error.response.data.message })
        } else {
          res.status(500).json({ message: error.message })
        }
      })
  }
  if (!isLocalMode) {
    // console.log("Aitorios Connect Mode")
    await readDeviceImage(req.query.deviceId.toString())
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        if (error.response) {
          res.status(500).json({ message: error.response.data.message })
        } else {
          res.status(500).json({ message: error.message })
        }
      })
  }
}
