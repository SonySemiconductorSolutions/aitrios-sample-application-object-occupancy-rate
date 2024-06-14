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
import getIsLocalMode from "./readModeSettings"

const PUBLIC_DIRECTORY = './public'


// Local Simulate Mode
const getDevicesFile = async () => {
  const DEVICE_FILENAME = PUBLIC_DIRECTORY + '/deviceData/deviceData_example.json'
  let readData: Buffer

  if (!fs.existsSync(DEVICE_FILENAME)) {
    return null
  }

  try {
    readData = fs.readFileSync(DEVICE_FILENAME)
  } catch (error) {
    console.error(error)
  }

  const obj = JSON.parse(readData.toString())
  const res = { data: obj }
  return res.data
}

// Aitorios Connect Mode
// eslint-disable-next-line no-unused-vars
const getDevices = async () => {
  const DEVICE_FILENAME = PUBLIC_DIRECTORY + '/deviceData/deviceData.json'
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

  const res = await client.deviceManagement?.getDevices()
  return res.data
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }

  let isLocalMode=getIsLocalMode()
  if(isLocalMode){
    await getDevicesFile()
    .then(result => {
      const deviceData: string[] = []
      result.devices.forEach((elm: any) => {
        const modelIds = elm.models.map((model: any) => model.model_version_id.split(':')[0]).filter((modelName: any) => modelName !== '')
        if (modelIds.length === 0) return
        deviceData.push(elm.device_id)
      })
      res.status(200).json(deviceData)
    }).catch(err => {
      if (err.response) {
        res.status(500).json({ message: err.response.data.message })
      } else {
        res.status(500).json({ message: err.message })
      }
    })
  }
  if (!isLocalMode){
    await getDevices()
    .then(result => {
      const deviceData: string[] = []
      result.devices.forEach((elm: any) => {
        const modelIds = elm.models.map((model: any) => model.model_version_id.split(':')[0]).filter((modelName: any) => modelName !== '')
        if (modelIds.length === 0) return
        deviceData.push(elm.device_id)
      })
      res.status(200).json(deviceData)
    }).catch(err => {
      if (err.response) {
        res.status(500).json({ message: err.response.data.message })
      } else {
        res.status(500).json({ message: err.message })
      }
    })
  }
}
