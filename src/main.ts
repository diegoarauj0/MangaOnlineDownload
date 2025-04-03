import QueryManga from "./queryManga"
import DownloadManga from "./downloadManga"

export default async function Main(mangas: string[]): Promise<void> {
  console.log(`${mangas.length} items listed`)

  for (const mangaName of mangas) {
    try {
      console.log("----------------------------------")
      console.log(`Getting information from the manga ${mangaName}\n`)

      const manga = await QueryManga(mangaName)

      console.log(`name => ${manga.mangaName}`)
      console.log(`chapters => ${manga.mangaChapters.length}\n`)
      console.log(`description => ${manga.mangaDescription}`)

      console.log("|  Starting chapter downloads\n")

      await DownloadManga(mangaName, manga.mangaChapters)

    } catch (error) {
      console.log(error)
      console.log(`Unable to locate the manga ${mangaName} D:`)
    }
  }
}