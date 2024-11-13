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

const PUBLIC_DIRECTORY = './public'
const SETTING_DIRECTORY = PUBLIC_DIRECTORY + '/settings'
const SETTING_FILENAME = SETTING_DIRECTORY + '/settings.json'

const readSettings = async () => {
  let readData: Buffer

  if (!fs.existsSync(SETTING_FILENAME)) {
    console.log('shelffile is not exists.')
    return null
  }

  try {
    readData = fs.readFileSync(SETTING_FILENAME)
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
  await readSettings()
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
