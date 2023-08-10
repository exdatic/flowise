import { INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { BingSerpAPI } from 'langchain/tools'

class BingSerpAPI_Tools implements INode {
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
        this.label = 'Bing Serp API'
        this.name = 'bingSerpAPI'
        this.version = 1.0
        this.type = 'BingSerpAPI'
        this.icon = 'bing.png'
        this.category = 'Tools'
        this.description = 'Wrapper around Bing SerpAPI - a real-time API to access Bing search results'
        this.inputs = [
            {
                label: 'Bing Serp Api Key',
                name: 'apiKey',
                type: 'password'
            }
        ]
        this.baseClasses = [this.type, ...getBaseClasses(BingSerpAPI)]
    }

    async init(nodeData: INodeData): Promise<any> {
        const apiKey = nodeData.inputs?.apiKey as string
        return new BingSerpAPI(apiKey && apiKey.length > 0 ? apiKey : undefined)
    }
}

module.exports = { nodeClass: BingSerpAPI_Tools }
