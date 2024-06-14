/* eslint-disable no-undef */
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
import React, { useState, useEffect } from 'react'
import router from 'next/router'
import axios from 'axios'
import styles from '../styles/drawerMng.module.css'
import { API_TIME_OUT } from '../common/config'

export default function DrawerMng () {
  const [shelfList, setShelfList] = useState<string[]>([])
  const [allDrawerList, setAllDrawerList] = useState<drawers[]>([])
  const [drawerList, setDrawerList] = useState<string[]>([])

  useEffect(() => {
    let shelfObj: string[] = []
    let drawerObj: drawers[] = []
    const get = async () => {
      try {
        const response = await axios.get('/api/getShelfList', { timeout: API_TIME_OUT })
        if (response.data) {
          shelfObj = response.data
          setShelfList(shelfObj)
        }
      } catch (error) {
        console.error(error)
        return
      }

      try {
        const response = await axios.get('/api/getDrawerList', { timeout: API_TIME_OUT })
        if (response.data) {
          drawerObj = response.data
          setAllDrawerList(drawerObj)
          const drawer = drawerObj.find((element) => element.shelfName === shelfObj[0])
          if (drawer !== undefined) {
            setDrawerList(drawer.drawerList)
          }
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  const addDrawer = () => {
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value
    const drawerName = (document.getElementById('drawerName') as HTMLInputElement).value
    const newList = [...allDrawerList]

    let targetDrawer = newList.find(element => element.shelfName === shelfName)

    if (targetDrawer === undefined) {
      targetDrawer = { shelfName, drawerList: [drawerName] }
      newList.push(targetDrawer)
      newList.sort((elm1, elm2) => {
        if (elm1.shelfName < elm2.shelfName) {
          return -1
        }
        if (elm1.shelfName > elm2.shelfName) {
          return 1
        }
        return 0
      })
    } else {
      targetDrawer.drawerList.push(drawerName)
      targetDrawer.drawerList.sort((elm1, elm2) => {
        if (elm1 < elm2) {
          return -1
        }
        if (elm1 > elm2) {
          return 1
        }
        return 0
      })
    }
    setAllDrawerList(newList)
    setDrawerList(targetDrawer.drawerList)
  }

  const deleteDrawer = () => {
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value
    const selectedIndex = (document.getElementById('drawerList') as HTMLSelectElement).selectedIndex

    if (selectedIndex === -1) {
      return
    }

    let newList = [...allDrawerList]

    const targetDrawer = newList.find(element => element.shelfName === shelfName)
    if (targetDrawer !== undefined) {
      targetDrawer.drawerList.splice(selectedIndex, 1)
      setDrawerList(targetDrawer.drawerList)
      if (targetDrawer.drawerList.length === 0) {
        newList = newList.filter(elm => elm.shelfName !== shelfName)
      }
    }

    setAllDrawerList(newList)
  }

  const saveDrawer = () => {
    const put = async () => {
      try {
        await axios.put('/api/putDrawerList', allDrawerList, { timeout: API_TIME_OUT })
      } catch (error) {
        console.log(error)
      }
    }
    put()
  }

  const changeShelf = (e) => {
    const nowShelf = e.target.value
    const drawer = allDrawerList.find((element) => element.shelfName === nowShelf)
    if (drawer !== undefined) {
      setDrawerList(drawer.drawerList)
    } else {
      setDrawerList([])
    }
  }

  return (
    <div>
      <h1 className='title'>棚段登録</h1>
      <div className={styles.shelfTable}>
        <div className={styles.shelfDiv}>
          <div><a>棚一覧</a></div>
          <div>
            <select id='shelfList' className={styles.shelfList} onChange={(e) => changeShelf(e)}>
              {
                shelfList.map((item) => {
                  return (
                    <option value={item} key={item}>{item}</option>
                  )
                })
              }
            </select>
          </div>
        </div>
        <div className={styles.inputDrawerDiv}>
            <div><a>棚段名</a></div>
            <input id='drawerName' type='text'></input>
        </div>
        <div className={styles.buttonDiv}>
          <div className={styles.button}><button onClick={() => addDrawer()}>追加</button></div>
          <div className={styles.button}><button onClick={() => deleteDrawer()}>削除</button></div>
          <div className={styles.button}><button onClick={() => saveDrawer()}>保存</button></div>
        </div>
        <div className={styles.drawerDiv}>
          <div><a>棚段一覧</a></div>
            <div>
              <select id='drawerList' className={styles.drawerList} size={10}>
                {
                    drawerList.map((item) => {
                      return (
                            <option value={item} key={item}>{item}</option>
                      )
                    })
                }
            </select>
          </div>
        </div>
      </div>
      <div className={styles.footter}>
        <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
      </div>
    </div>
  )
}
