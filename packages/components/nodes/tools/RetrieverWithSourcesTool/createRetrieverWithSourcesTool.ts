import { z } from 'zod'
import { CallbackManagerForToolRun } from 'langchain/callbacks'
import { BaseRetriever } from 'langchain/schema/retriever'
import { DynamicStructuredTool, DynamicStructuredToolInput } from 'langchain/tools'
import { Document } from 'langchain/document'

export const isValidURL = (url: string) => {
    try {
        return new URL(url)
    } catch (err) {
        return undefined
    }
}

export function createRetrieverWithSourcesTool(retriever: BaseRetriever, input: Omit<DynamicStructuredToolInput, 'func' | 'schema'>) {
    const pageContentWithSource = (source: Document) => {
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
    const func = async ({ input }: { input: string }, runManager?: CallbackManagerForToolRun) => {
        const docs = await retriever.getRelevantDocuments(input, runManager?.getChild('retriever'))
        return docs.map((doc) => pageContentWithSource(doc)).join('\n\n')
    }
    const schema = z.object({
        input: z.string().describe('Natural language query used as input to the retriever')
    })
    return new DynamicStructuredTool({ ...input, func, schema })
}
