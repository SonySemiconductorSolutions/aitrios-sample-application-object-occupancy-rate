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
const DEVICINFERENCE_DIRECTORY = PUBLIC_DIRECTORY + '/deviceInference'

const readDeviceInferenceFile = async (deviceName: string) => {
  let readData: Buffer

  const readFileName: string = DEVICINFERENCE_DIRECTORY + '/' + deviceName + '.json'

  if (!fs.existsSync(readFileName)) {
    return { inference: '' }
  }

  try {
    readData = fs.readFileSync(readFileName)
  } catch (error) {
    console.error(error)
    return { inference: '' }
  }

  const obj = JSON.parse(readData.toString())
  const inferenceData = obj.Inferences[0].O

  return { Inference: inferenceData }
}

// eslint-disable-next-line no-unused-vars
const readDeviceInference = async (deviceName: string) => {
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

  const NumberOfInferenceresults = 1
  const filter = undefined
  const raw = 1
  const resInference = await client.insight.getInferenceResults(deviceName, filter, NumberOfInferenceresults, raw)
  let inferenceData = {}
  inferenceData = resInference.data[0].inference_result.Inferences[0].O

  return { Inference: inferenceData }
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

  let isLocalMode=getIsLocalMode()
  if(isLocalMode){
    //console.log("Local Simulate Mode")
    await readDeviceInferenceFile(req.query.deviceId.toString())
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
  if(!isLocalMode){
    //console.log("Aitorios Connect Mode")
    await readDeviceInference(req.query.deviceId.toString())
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
