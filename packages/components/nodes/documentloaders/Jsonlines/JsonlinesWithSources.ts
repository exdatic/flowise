import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
// import { JSONLinesLoader } from 'langchain/document_loaders/fs/json'
import { JsonlinesWithSourceLoader } from './JsonlinesWithSourcesLoader'

class JsonlinesWithSources_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]

    constructor() {
        this.label = 'Json Lines File with Sources'
        this.name = 'jsonlinesFileWithSources'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'jsonlines.svg'
        this.category = 'Document Loaders'
        this.description = `Load data from JSON Lines files with sources`
        this.baseClasses = [this.type]
        this.inputs = [
            {
                label: 'Jsonlines File',
                name: 'jsonlinesFile',
                type: 'file',
                fileType: '.jsonl'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                placeholder: 'Enter pointer name',
                optional: false
            },
            {
                label: 'Source Pointer Extraction',
                name: 'sourcePointerName',
                type: 'string',
                placeholder: 'Enter source pointer name',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Title Pointer Extraction',
                name: 'titlePointerName',
                type: 'string',
                placeholder: 'Enter title pointer name',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Metadata',
                name: 'metadata',
                type: 'json',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const jsonLinesFileBase64 = nodeData.inputs?.jsonlinesFile as string
        const pointerName = nodeData.inputs?.pointerName as string
        const sourcePointerName = nodeData.inputs?.sourcePointerName as string
        const titlePointerName = nodeData.inputs?.titlePointerName as string
        const metadata = nodeData.inputs?.metadata

        let alldocs = []
        let files: string[] = []

        let pointer = '/' + pointerName.trim()
        let sourcePointer = sourcePointerName ? '/' + sourcePointerName.trim() : undefined
        let titlePointer = titlePointerName ? '/' + titlePointerName.trim() : undefined

        if (jsonLinesFileBase64.startsWith('[') && jsonLinesFileBase64.endsWith(']')) {
            files = JSON.parse(jsonLinesFileBase64)
        } else {
            files = [jsonLinesFileBase64]
        }

        for (const file of files) {
            const splitDataURI = file.split(',')
            splitDataURI.pop()
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64')
            const blob = new Blob([bf])
            const loader = new JsonlinesWithSourceLoader(blob, pointer, sourcePointer, titlePointer)

            if (textSplitter) {
                const docs = await loader.loadAndSplit(textSplitter)
                alldocs.push(...docs)
            } else {
                const docs = await loader.load()
                alldocs.push(...docs)
            }
        }

        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            let finaldocs = []
            for (const doc of alldocs) {
                const newdoc = {
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        ...parsedMetadata
                    }
                }
                finaldocs.push(newdoc)
            }
            return finaldocs
        }

        return alldocs
    }
}

module.exports = { nodeClass: JsonlinesWithSources_DocumentLoaders }
