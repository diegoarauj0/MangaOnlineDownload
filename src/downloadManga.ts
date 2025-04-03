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

    let chapterText = chapter.number.toString().padStart(3, '0')

    if (!Number.isInteger(chapter.number)) {
      chapterText = chapter.number.toString().substring(chapter.number.toString().indexOf("."),0).padStart(3, '0')
      chapterText += `-${chapter.number.toString().substring(chapter.number.toString().indexOf(".") + 1)}`
    }

    const chapterURL = path.join(__dirname, "/..", "/downloads",`/${name}`, `/Chapter ${chapterText}`)

    try {
      if (fs.existsSync(chapterURL)) {
        console.log(`|  Skipping chapter ${chapter.number}`)
        continue
      }

      await Wait(waitForChapter)

      console.log(`|  Downloading Chapter ${chapter.number}`)

      const response = await fetch(chapter.URL, {
        method: "GET"
      })

      const text = await response.text()

      const dom = new jsdom.JSDOM(text)

      const elements = dom.window.document.querySelector(".content")?.querySelectorAll("img") as NodeListOf<HTMLImageElement>

      await fs.promises.mkdir(chapterURL)

      let index = 1

      for (const imageElement of elements) {
        await Wait(waitForPage)
        console.log(`|    Downloading Page ${index}`)
        await DownloadImage(imageElement.src, path.join(chapterURL, `/${index.toString().padStart(3, '0')}.jpg`))
        index ++
      }

    } catch {
      console.log(" Unable to download this chapter")
      if (fs.existsSync(chapterURL)) {
        await fs.promises.unlink(chapterURL)
      }
    }
  }     
}