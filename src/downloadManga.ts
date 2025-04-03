import fs from "fs"
import path from "path"
import jsdom from "jsdom"
import { waitForChapter, waitForPage } from "../config/config.json"

function Wait(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => { resolve() }, time)
  })
}

async function DownloadImage(URL: string, path: string): Promise<void> {
  const response = await fetch(URL)
  const arrayBuffer = await response.arrayBuffer()

  await fs.promises.writeFile(path, Buffer.from(arrayBuffer))
}

export default async function DownloadManga(mangaName: string, mangaChapters: { URL: string, number: number } []): Promise<void> {
  const name = mangaName.normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[<>:"\/\\|?*]/g, '').replace(/\s+/g, '_').trim()

  if (!fs.existsSync(path.join(__dirname, "/..", "/downloads"))) {
    await fs.promises.mkdir(path.join(__dirname, "/..", "/downloads"))
  }

  if (!fs.existsSync(path.join(__dirname, "/..", "/downloads",`/${name}`))) {
    await fs.promises.mkdir(path.join(__dirname, "/..", "/downloads",`/${name}`))
  }

  for (const chapter of mangaChapters) {
    await Wait(waitForChapter)

    try {
      if (fs.existsSync(path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapter.number.toString().padStart(3, '0')}`))) {
        continue
      }

      console.log(`|  Downloading Chapter ${chapter.URL}`)

      const response = await fetch(chapter.URL, {
        method: "GET"
      })

      const text = await response.text()

      const dom = new jsdom.JSDOM(text)

      const elements = dom.window.document.querySelector(".content")?.querySelectorAll("img") as NodeListOf<HTMLImageElement>

      await fs.promises.mkdir(path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapter.number.toString().padStart(3, '0')}`))

      let index = 1

      for (const imageElement of elements) {
        await Wait(waitForPage)
        console.log(`|    Downloading Page ${imageElement.src}`)
        await DownloadImage(imageElement.src, path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapter.number.toString().padStart(3, '0')}`, `/${index.toString().padStart(3, '0')}.jpg`))
        index ++
      }

    } catch {
      console.log(" Unable to download this chapter")
      if (fs.existsSync(path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapter.number.toString().padStart(3, '0')}`))) {
        await fs.promises.unlink(path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapter.number.toString().padStart(3, '0')}`))
      }
    }
  }     
}