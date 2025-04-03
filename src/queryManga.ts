import { baseURL } from "../config/config.json"
import jsdom from "jsdom"

export default async function QueryManga(name: string): Promise<{
  mangaChapters: { URL: string, number: number }[],
  mangaName: string,
  mangaDescription: string,
}> {
  const response = await fetch(`${baseURL}/manga/${name}`)

  if (response.status !== 200) { throw response }

  const text = await response.text()

  const dom = new jsdom.JSDOM(text)

  const data = dom.window.document.querySelector(".data") as HTMLDivElement

  const mangaName: string = data.querySelector("h1")?.innerHTML || ""
  const mangaDescription: string = data.querySelectorAll("p")[1].innerHTML || ""
  const mangaChapters: { URL:string, number: number }[] = []

  dom.window.document.querySelector(".episodios")?.querySelectorAll(".episodiotitle").forEach((element) => {
    const href = element?.querySelector("a")?.href

    if (href === undefined) { throw new Error("") }

    mangaChapters.push({
      URL:href,
      number:Number(href.substring(href.indexOf("capitulo-")).replace(/[^0-9]/g, ""))
    })
  })

  return {
    mangaChapters: mangaChapters.reverse(),
    mangaDescription: mangaDescription,
    mangaName: mangaName,
  }
}