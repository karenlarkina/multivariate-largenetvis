from joblib import load
import json
import time


from graph_taxonomies import Structural_Taxonomy, Temporal_Taxonomy, Evolution_taxonomy
import networkx as nx
from networkx.readwrite import json_graph

from graph import Graph
from resolution import Resolution
from random import seed, randrange
class Model:

    #def generateListGraphs(self):
        #oGraph = Graph()
        #mainGraph = oGraph.getGraph()
        #partitions = oGraph.findGroups(mainGraph, 'louvain')
        #dict_commun_graph = oGraph.splitGraph(mainGraph, partitions)
        #dict_commun_graph = oGraph.divide_timeslices(dict_commun_graph, 5)
        #return oGraph.generateGraphsFromGroups(dict_commun_graph)

    def generateListGraphs(self):
        
        #retornar uma lista de grafos da networkx para cada cluster per timeslice.
        #calcular o resultado da evolution taxonomy para cada cluster per timeslice.
        
        return 0
        
    def __init__(self, networkfolder, networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename, numberTimeslices, edge_attribute, samplingMethod, percentageSampling, minimumCommunitySize, sigma):

        start = time.time() 

        oGraph = Graph(networkfolder, networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename, edge_attribute)
        oGraph.sampleGraph(samplingMethod, percentageSampling)
        
        mainDf = oGraph.getDf()

        self.graphNodeMetadata  = oGraph.getNodeMetadataDf()
        self.dfNodeExtraMetadata  = oGraph.getNodeExtraMetadata()
        self.uniqueEdgeLabels = oGraph.getgraphEdgeLabels()

        self.generatedTimeslices, list_dfs = oGraph.divide_df_timeslices(mainDf,int(numberTimeslices))
       
        self.nodeDegreeNormalized, self.nodeBetweennessNormalized,self.nodeClosenessNormalized,self.total_numberCommunities,self.avg_modularity,dict_commun_graph,self.partitions, self.dict_ids_return, self.dict_ids_communities = oGraph.findGroups(list_dfs, 'louvain', minimumCommunitySize)
        
        self.graphs = oGraph.generateGraphsFromGroups(dict_commun_graph)
        self.sigma = sigma
        #print('....dict_commun_graph......')
        #print(dict_commun_graph.values())
        #print('.......graphs.......')
        #print(len(self.graphs))
        #print('....partitions......')
        #print(len(self.partitions))

        self.structuralTaxonomy = Structural_Taxonomy()
        self.temporalTaxonomy = Temporal_Taxonomy()

        #print('DICIONARIOS AQUIIIIII', self.dict_ids_communities)
        
        end = time.time()
        print('....time to open file.......')
        print(end - start,' seconds')
        print('')

        #dict_commun_graph = oGraph.splitGraph(oGraph.getGraph(), self.partitions)
        #self.graphs = oGraph.generateGraphsFromGroups(dict_commun_graph)
        
        ### São 10 grafos (10 timeslices) e um monte de comunidades (partições). É preciso criar um grafo pra cada comunidade. Isso está dando erro hoje.

    # ------------------- Not used -------------------
    def getCandidateNumberTimeslices(self):
        # tentar usar o valor da resolução em si como quantidade de timeslices

        start = time.time()

        resolution = Resolution()
        mainDf = self.oGraph.getDf()

        minTime = mainDf["t"].min()
        maxTime = mainDf["t"].max()

        totalNumerOfTimestamps = maxTime - minTime + 1
        
        #avg, median, min, max resolutions computed by Adaptive Resolution for fadingfactors 0.9, 0.99, 0.999
        resolutionsFadingFactor09 = resolution.computeAdaptiveResolution(mainDf, 0.9)
        resolutionsFadingFactor099 = resolution.computeAdaptiveResolution(mainDf, 0.99)
        resolutionsFadingFactor0999 = resolution.computeAdaptiveResolution(mainDf, 0.999)

        output = []
        output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor09, totalNumerOfTimestamps))
        output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor099, totalNumerOfTimestamps))
        output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor0999, totalNumerOfTimestamps))

        #print(output)

        end = time.time()
        print('....time to compute candidate timeslices .......')
        print(end - start,' seconds')
        print('')

        return json.dumps(output)

    def getTaxonomy(self):

        
        start = time.time()


        features = []
        
        for key in self.graphs:
            for g in self.graphs[key]:
                features.append(self.structuralTaxonomy.graph_feature_vector(g))

        #structural_taxonomy = self.structuralTaxonomy.graph_topology_new(features,5)
        
        vec_evolution_taxonomy = ['birth', 'death', 'grow', 'contract', 'split', 'merge']

        x = 0
        graphs_json = []

        temp_obj = {}
        temp_obj['generatedTimeslices'] = self.generatedTimeslices
        graphs_json.append(temp_obj)

        resultConversion, resultAlluvial = self.getCommunitiesEvolution()

        #print(resultConversion)

        correct_timeslice_id = list(self.dict_ids_return.keys())
        #print('CORRECT TIMESLICE', correct_timeslice_id)

        count = 0
        #seed(1)
        for key in self.graphs:
            for g in self.graphs[key]:
                
                temp_obj = {}
                #graph_json = json_graph.node_link_data(graph, {"link": "edges", "source": "from", "target": "to"})
                graph_json = json_graph.node_link_data(g)
                temp_obj['graph'] = graph_json
                
                temp_obj['structural_taxonomy'] = self.structuralTaxonomy.graph_topology_has(g)
                #temp_obj['structural_taxonomy'] = structural_taxonomy[x]

                times = key.split(' ')

                community_id = self.dict_ids_communities[(list(g.nodes)[0],correct_timeslice_id[count])]
                #print(' ')
                #print('ID DA COMUNIDADE CORRESPONDENTE: ', community_id)
                #print(' ')
                min_t = times[0]
                max_t = times[1]

                tax1, tax2 = self.temporalTaxonomy.graph_topology(g, int(min_t), int(max_t))
                #print(tax1)
                #print(tax2)

                #['birth', 'death', 'grow', 'contract', 'split', 'merge']
                #READ AND INTERPRET THE EVOLUTION TAXONOMY RESULT
                #print(count,x)
                #print('TIMESLICE: ', key, correct_timeslice_id[count-1])
                #print('PRIMEIRO NO DE CADA COMUNIDADE/TIMESLICE: ', list(g.nodes)[0])


                #community_id = [i[2] for i in self.partitions if (i[0] == list(g.nodes)[0])  and  (i[1] == correct_timeslice_id[count])][0]
                
                temp_obj['id_community'] = community_id


                result_ET = [i for i in resultAlluvial[correct_timeslice_id[count]] if i[0] == community_id]

                #print('RESULT EVOLUTION TAXONOMY: ', result_ET)
                #print(' ')

                if(len(result_ET) == 0): #bug?
                    tax3 = 'death'
                elif(len(result_ET) == 1):
                    tax3 = result_ET[0][2].lower()
                else:
                    tax3 = result_ET[1][2].lower()

                #Simplifying the evolution taxonomy
                if(tax3 == 'begin' or tax3 == 'regenerate'):
                    tax3 = 'birth'
                elif(tax3 == 'preserve' or tax3 == 'replace'):
                    tax3 = 'contract' #trocar para continuation
                elif(tax3 == 'vanish' or tax3 == 'absorb'):
                    tax3 = 'death'

                #print('RESULT EVOLUTION TAXONOMY: ', tax3)
                #print('')

                #randomvalue = randrange(6)
                #tax3 = vec_evolution_taxonomy[randomvalue]

                temp_obj['timeslice'] = key
                temp_obj['temporal_taxonomy1'] = tax1
                temp_obj['temporal_taxonomy2'] = tax2
                temp_obj['evolution_taxonomy'] = tax3
                graphs_json.append(temp_obj)

                x = x + 1
            
            count = count + 1


        end = time.time()
        print('....time to calculate taxonomies.......')
        print(end - start,' seconds')
        

        
        return json.dumps(graphs_json)

    def getCommunitiesEvolution(self):


        start = time.time()
        print('------- Computing evolution taxonomy ----------')
        evolutionTaxonomy = Evolution_taxonomy()
        
        #if(len(self.partitions) == 0):
            #return json.dumps({}),''

        # Tem que mandar o sigma nessa linha de baixo
        resultTaxonomy = evolutionTaxonomy.calculate_evolution_taxonomy(self.partitions, self.sigma)
        resultAlluvial = evolutionTaxonomy.conversion_to_alluvial(resultTaxonomy)

        temp_obj = {}
        temp_obj['communitiesPerTimeslice'] = self.dict_ids_return
        temp_obj['communitiesEvolution'] = resultAlluvial

        end = time.time()
        print('....time to compute evolution taxonomy.......')
        print(end - start,' seconds')
        print('')

        #resultConversion = evolutionTaxonomy.convert_community_per_time_to_evolution_taxonomy(resultAlluvial)

        #print(resultAlluvial)

        return json.dumps(temp_obj), resultAlluvial
        #return resultAlluvial

    def getCommunitiesEvolutionTeste(self):


        start = time.time()
        print('------- TESTE: Computing evolution taxonomy ----------')
        evolutionTaxonomy = Evolution_taxonomy()
        
        #if(len(self.partitions) == 0):
            #return json.dumps({}),''

        # Tem que mandar o sigma nessa linha de baixo
        resultTaxonomy = evolutionTaxonomy.calculate_evolution_taxonomy(self.partitions, self.sigma)
        resultAlluvial = evolutionTaxonomy.conversion_to_alluvial(resultTaxonomy)

        temp_obj = {}
        temp_obj['communitiesPerTimeslice'] = self.dict_ids_return
        temp_obj['communitiesEvolution'] = resultAlluvial

        end = time.time()
        print('....time to compute evolution taxonomy.......')
        print(end - start,' seconds')
        print('')

        #resultConversion = evolutionTaxonomy.convert_community_per_time_to_evolution_taxonomy(resultAlluvial)

        #print(resultAlluvial)

        return json.dumps(temp_obj), resultAlluvial
        #return resultAlluvial

    def getNodeMetadata(self):

        #get metadata that will be mapped using color
        if self.graphNodeMetadata is None:
            parsed1 = []
        else:
            result = self.graphNodeMetadata.to_json(orient="records")
            parsed1 = json.loads(result)


        #get metadata that will be written in the nodelink tooltip
        if self.dfNodeExtraMetadata is None:
            parsed2 = []
        else:
            result = self.dfNodeExtraMetadata.to_json(orient="records")
            parsed2 = json.loads(result)

        output = {}
        output['metadataColor'] = parsed1
        output['metadataTooltip'] = parsed2
        #return json.dumps(parsed1), json.dumps(parsed2)
        return json.dumps(output)

    def getGraphEdgeLabels(self):

        #get metadata that will be mapped using color
        # if self.uniqueEdgeLabels is None:
        #     parsed1 = []
        # else:
        #     result = self.uniqueEdgeLabels.to_json(orient="records")
        #     parsed1 = json.loads(result)

        # output = {}
        # output['edgeLabels'] = parsed1
        # #return json.dumps(parsed1), json.dumps(parsed2)

        return json.dumps(list(self.uniqueEdgeLabels))

    def getGraphInfo(self):
        temp_obj = {}
        temp_obj['avg_modularity'] = self.avg_modularity
        
        temp_obj['total_numberCommunities'] = self.total_numberCommunities

        return json.dumps(temp_obj)

    def getNodeInfo(self):
        temp_obj = {}
        temp_obj['normalizedDegreeCentrality'] = self.nodeDegreeNormalized
        temp_obj['nodeClosenessNormalized'] = self.nodeClosenessNormalized
        temp_obj['nodeBetweennessNormalized'] = self.nodeBetweennessNormalized
        
   
        return json.dumps(temp_obj)        