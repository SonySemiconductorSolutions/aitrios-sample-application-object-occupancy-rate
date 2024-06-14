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

import * as yaml from 'js-yaml'
import * as fs from 'fs'

export const API_TIME_OUT = 15000

export interface ConsoleAccessLibrarySettings {
    consoleEndpoint: string
    portalAuthorizationEndpoint: string
    clientSecret: string
    clientId: string
}

const ConsoleAccessLibrarySettingsFile = './common/console_access_settings.yaml'

export function getConsoleAccessLibrarySettings () {
  if (!fs.existsSync(ConsoleAccessLibrarySettingsFile)) {
    console.log('console_access_settings.yaml file is not exist.')
    return
  }
  if (fs.lstatSync(ConsoleAccessLibrarySettingsFile).isSymbolicLink()) {
    console.log('Can\'t open symbolic link console_access_settings.yaml file.')
    return
  }
  const consoleAccessSettingFileData = yaml.load(fs.readFileSync(ConsoleAccessLibrarySettingsFile, { encoding: 'utf8', flag: 'r' }))
  const consoleAccessSettings: ConsoleAccessLibrarySettings = {
    consoleEndpoint: consoleAccessSettingFileData.console_access_settings.console_endpoint,
    portalAuthorizationEndpoint: consoleAccessSettingFileData.console_access_settings.portal_authorization_endpoint,
    clientSecret: consoleAccessSettingFileData.console_access_settings.client_secret,
    clientId: consoleAccessSettingFileData.console_access_settings.client_id
  }
  return consoleAccessSettings
}
