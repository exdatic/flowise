import type { readFile as ReadFileT } from 'node:fs/promises'
import jsonpointer from 'jsonpointer'
import { Document } from 'langchain/document'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'

export class JSONLinesLoader extends BaseDocumentLoader {
    constructor(public filePathOrBlob: string | Blob, public pointer: string) {
        super()
    }

    public async load(): Promise<Document[]> {
        let text: string
        let metadata: Record<string, string>
        if (typeof this.filePathOrBlob === 'string') {
            const { readFile } = await JSONLinesLoader.imports()
            text = await readFile(this.filePathOrBlob, 'utf8')
            metadata = { source: this.filePathOrBlob }
        } else {
            text = await this.filePathOrBlob.text()
            metadata = { source: 'blob', blobType: this.filePathOrBlob.type }
        }

        const jsptr = jsonpointer.compile(this.pointer)
        const parse = (json: any, i: number) => {
            const pageContent = jsptr.get(json)
            if (typeof pageContent !== 'string') {
                throw new Error(`Expected string, at position ${i} got ${typeof pageContent}`)
            }
            return new Document({
                pageContent,
                metadata: {
                    ...metadata,
                    line: i + 1,
                    ...Object.fromEntries(Object.entries(json).filter(([k]) => k !== this.pointer))
                }
            })
        }

        const lines = text.split('\n')
        const jsons = lines
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        return jsons.map((json, i) => parse(json, i))
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
