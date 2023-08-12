import { CallbackManagerForToolRun } from 'langchain/callbacks'
import { BaseRetriever } from 'langchain/schema/retriever'
import { DynamicTool, DynamicToolInput } from 'langchain/tools'
import { Document } from 'langchain/document'

export const isValidURL = (url: string) => {
    try {
        return new URL(url)
    } catch (err) {
        return undefined
    }
}

export function createRetrieverWithSourcesTool(retriever: BaseRetriever, input: Omit<DynamicToolInput, 'func'>) {
    const getContentWithSource = (source: Document) => {
        const content = source.pageContent
        const url = isValidURL(source.metadata.source)
        if (url) {
            const title = source.metadata.title
            if (title) {
                return `[${title}](${url})\n${content}`
            } else {
                return `[](${url})\n${content}`
            }
        }
        return content
    }
    const func = async (input: string, runManager?: CallbackManagerForToolRun) => {
        const docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))
        return docs.map((doc) => getContentWithSource(doc)).join('\n\n')
    }
    return new DynamicTool({ ...input, func })
}
