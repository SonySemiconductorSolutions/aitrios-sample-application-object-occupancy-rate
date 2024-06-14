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
import React from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/topPage.module.css'

interface MenuArray {
    route: string,
    menu: string,
    desc: string
}

export default function TopPage () {
  const router = useRouter()

  const menuArray: MenuArray[] = [
    { route: './shelfMng', menu: '棚登録', desc: '測定対象の棚を登録します' },
    { route: './drawerMng', menu: '棚段登録', desc: '棚に段を登録します' },
    { route: './deviceRelation', menu: 'デバイス登録', desc: 'デバイスに棚段を関連付けます' },
    { route: './deviceRange', menu: 'カメラ範囲登録', desc: 'カメラの判定範囲を登録します' },
    { route: './shelfOccupancy', menu: '占有率(棚)', desc: '棚毎の占有率を表示します' },
    { route: './allOccupapncy', menu: '占有率(全体)', desc: '棚全体の占有率を表示します' },
    { route: './deviceInference', menu: '推論結果表示', desc: 'デバイス毎の推論結果を表示します' },
    { route: './inferenseSettings', menu: '設定', desc: '各種設定を行います' }
  ]
  return (
        <div>
          <h1 className='title'>物体占有率 可視化サンプルアプリケーション</h1>
          <table className={styles.topPageTable}>
            <thead >
              <tr>
                <td >メニュー</td>
                <td >ページの説明</td>
              </tr>
            </thead>
            <tbody>
                {
                    menuArray.map((element) => {
                      return (
                            <tr key={element.route}>
                              <td className={`${styles.topTableMenu} ${styles.menuLink}`}><a onClick={() => router.push(element.route)}>{element.menu}</a></td>
                              <td className={styles.topTableEx}>{element.desc}</td>
                            </tr>
                      )
                    })
                }
            </tbody>
          </table>
        </div>
  )
}
