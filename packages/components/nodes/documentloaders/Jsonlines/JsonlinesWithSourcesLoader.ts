import type { readFile as ReadFileT } from 'node:fs/promises'
import jsonpointer from 'jsonpointer'
import { Document } from 'langchain/document'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'

/**
 * Class that extends the `BaseDocumentLoader` class. It represents a document
 * loader that loads documents from JSON Lines files. It has a constructor
 * that takes a `filePathOrBlob` parameter representing the path to the
 * JSON Lines file or a `Blob` object, and a `pointer` parameter that
 * specifies the JSON pointer to extract.
 */
export class JsonlinesWithSourceLoader extends BaseDocumentLoader {
    constructor(public filePathOrBlob: string | Blob, public pointer: string, public sourcePointer?: string, public titlePointer?: string) {
        super()
    }

    public async load(): Promise<Document[]> {
        let text: string
        let metadata: Record<string, string>
        if (typeof this.filePathOrBlob === 'string') {
            const { readFile } = await JsonlinesWithSourceLoader.imports()
            text = await readFile(this.filePathOrBlob, 'utf8')
            metadata = { source: this.filePathOrBlob }
        } else {
            text = await this.filePathOrBlob.text()
            metadata = { source: 'blob', blobType: this.filePathOrBlob.type }
        }

        const pointer = jsonpointer.compile(this.pointer)
        const sourcePointer = this.sourcePointer ? jsonpointer.compile(this.sourcePointer) : undefined
        const titlePointer = this.titlePointer ? jsonpointer.compile(this.titlePointer) : undefined

        const lines = text.split('\n')
        const jsons = lines
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => JSON.parse(line))

        return jsons.map((json, i) => {
            const pageContent = pointer.get(json)
            if (typeof pageContent !== 'string') {
                throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`)
            }
            const source = sourcePointer?.get(json)
            if (typeof source === 'string') {
                metadata['source'] = source
            }
            const title = titlePointer?.get(json)
            if (typeof title === 'string') {
                metadata['title'] = title
            }
            if (jsons.length > 1) {
                metadata['line'] = (i + 1).toString()
            }
            return new Document({ pageContent, metadata })
        })
    }

    static async imports(): Promise<{
        readFile: typeof ReadFileT
    }> {
        try {
            const { readFile } = await import('node:fs/promises')
            return { readFile }
        } catch (e) {
            console.error(e)
            throw new Error('Failed to load fs/promises.')
        }
    }
}
