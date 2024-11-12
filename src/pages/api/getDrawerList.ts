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
import * as fs from 'fs'
import getIsLocalMode from './readModeSettings'

const PUBLIC_DIRECTORY = './public'
let DRAWER_FILENAME

const readDrawer = async () => {
  let readData: Buffer
  const isLocalMode = getIsLocalMode()
  if (isLocalMode) {
    // console.log("Local Simulate Mode")
    DRAWER_FILENAME = PUBLIC_DIRECTORY + '/drawerList/drawerList_example.json'
  }
  if (!isLocalMode) {
    // console.log("Aitorios Connect Mode")
    DRAWER_FILENAME = PUBLIC_DIRECTORY + '/drawerList/drawerList.json'
  }

  if (!fs.existsSync(DRAWER_FILENAME)) {
    return null
  }

  try {
    readData = fs.readFileSync(DRAWER_FILENAME)
  } catch (error) {
    console.error(error)
  }

  return readData.toString()
}

export default async function handler (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Only GET requests.' })
    return
  }
  await readDrawer()
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
