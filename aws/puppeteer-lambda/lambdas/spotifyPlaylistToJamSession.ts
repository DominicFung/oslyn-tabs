import puppeteer from 'puppeteer'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

import { AppSyncResolverEvent } from 'aws-lambda'

import { Page, PlaylistedTrack, SpotifyApi, Track } from '@spotify/web-api-ts-sdk'
import secret from '../secret.json'

import path from 'path'
import { exec } from 'child_process'

export const handler = async (event: AppSyncResolverEvent<{
  playlistId: string, 
}, null>): Promise<any> => {
    console.log(event.arguments)
    let browser

    try {
      if (process.platform === 'darwin') {
        console.log("This is MacOS Function ..")
        browser = await puppeteer.launch()
      } else {
        console.log("This is a Lambda Function ..")
        browser = await puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: chromium.headless,
        })
      }

      const page = await browser.newPage()
      const sdk = SpotifyApi.withClientCredentials(secret.spotify.clientId, secret.spotify.clientSecret, [])

      let spotifyPage = { next: null } as Page<PlaylistedTrack<Track>>
      do {

        spotifyPage = await sdk.playlists.getPlaylistItems(event.arguments.playlistId, undefined, undefined, 50)
        await page.goto("https://www.ultimate-guitar.com/")

        for (let p of spotifyPage.items) {
          let title = p.track.name
          let artist = p.track.artists[0].name

          // for (let a of p.track.artists) {
          //   if (artist !== "") artist += ", "
          //   artist += a.name
          // }

          let query = `${title} by ${artist}`
          console.log("Search for:", query)

          const inputField = await page.$("input")
          if (inputField) {
            await inputField.type(query)
            await inputField.press("Enter")
          } else {
            console.log('No input field found.')
          }

          await page.waitForNavigation()
          console.log(page.url())

          try {
            await page.waitForSelector('h1', { visible: true, timeout: 10000 })
          } catch(e) {
            console.warn("Couldn't get")
            if (process.platform === 'darwin') { 
              let dateTime = new Date()
              const screenshotPath = path.join(__dirname, `screenshot-${dateTime.toLocaleString()}.png`)
              await page.screenshot({ path: screenshotPath, fullPage: true })
              exec(`open ${screenshotPath}`)
            }
          }
          
          // @ts-ignore
          const h1 = await page.$eval('h1', (el: Element) => el.textContent)
          console.log('First <h1> text:', h1)
        }

      } while (spotifyPage.next != null)

        await browser.close()
    } catch(error) {
        console.log(error)
      } finally {
        await browser?.close()
        return {"status": "OK"}
      }

}