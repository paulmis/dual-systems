import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import map from './ts/scene.ts'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.leftMenu}>
        <div id={'poiCurrent'} className={styles.poiCurrentWrapepr}>
          <img className={styles.poiCurrentImage}/>
          <div className={styles.poiCurrentData}>
            <p className={styles.poiCurrentName}></p>
            <p className={styles.poiCurrentGravity}></p>
            <p className={styles.poiCurrentSize}></p>
          </div>
        </div>
        <div className={styles.poiListWrapper}>
          <div id={'poiListFilters'} className={styles.poiListFilters}>
          </div>
          <div id={'poiList'} className={styles.poiList}>

          </div>
        </div>
      </div>
      <div id={'map'} className={styles.mapWrapper}>
        
      </div>
    </div>
  )
}
