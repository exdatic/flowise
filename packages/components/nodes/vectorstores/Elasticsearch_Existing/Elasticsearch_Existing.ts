import { INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { ElasticVectorSearch } from '@langchain/community/vectorstores/elasticsearch'
import { Embeddings } from '@langchain/core/embeddings'
import { Client } from '@elastic/elasticsearch'
import { getBaseClasses } from '../../../src/utils'

class Elasticsearch_Existing_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'Elasticsearch Load Existing Index (Legacy)'
        this.name = 'elasticsearchExistingIndex'
        this.version = 1.0
        this.type = 'Elasticsearch'
        this.icon = 'elasticsearch.png'
        this.category = 'Vector Stores'
        this.description = 'Load existing index from Elasticsearch (i.e: Document has been upserted)'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.inputs = [
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Elasticsearch URL',
                name: 'elasticsearchURL',
                type: 'string',
                placeholder: 'http://127.0.0.1:9200'
            },
            {
                label: 'Index Name',
                name: 'indexName',
                type: 'string'
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'Elasticsearch Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Elasticsearch Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(ElasticVectorSearch)]
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const elasticsearchURL = nodeData.inputs?.elasticsearchURL as string
        const indexName = nodeData.inputs?.indexName as string
        const output = nodeData.outputs?.output as string
        const topK = nodeData.inputs?.topK as string
        const k = topK ? parseFloat(topK) : 4

        const client = new Client({
            nodes: [elasticsearchURL]
        })

        const vectorStore = new ElasticVectorSearch(embeddings, {
            client,
            indexName
        })

        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k)
            return retriever
        } else if (output === 'vectorStore') {
            ;(vectorStore as any).k = k
            return vectorStore
        }
        return vectorStore
    }
}

module.exports = { nodeClass: Elasticsearch_Existing_VectorStores }
