from fileManager import FileManager

from community import community_louvain
#from infomap import Infomap

import networkx as nx
from pandas import DataFrame
from statistics import mean
from sampling import Sampling
from resolution import Resolution
import math

import time
import json


class Graph:

    def __init__(self, networkfolder, networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename, edge_attribute):
        
        ofileManager = FileManager()
        self.dfGraph, self.graph, self.uniqueEdgeLabels, self.node_attributes, self.edge_attributes = ofileManager.readGraphFile(networkfolder, networkfilename, edge_attribute)

        #get metadata that will be mapped using color
        self.dfNodeMetadata = ofileManager.readNodeMetadataFile(networkfolder,networkfilename,nodeMetadatafilename)

        #get metadata that will be written in the nodelink tooltip
        if nodeExtraMetadataFilename != '':
            self.dfNodeExtraMetadata = ofileManager.readNodeExtraMedataFile(networkfolder,networkfilename, nodeExtraMetadataFilename)
        else:
            self.dfNodeExtraMetadata = None

        #if nodeMetadatafilename != '':
         #   self.dfNodeMetadata = ofileManager.readNodeMetadataFile(networkfolder, nodeMetadatafilename)
        #else:
         #   self.dfNodeMetadata = None


    def getGraphInfo(self):

        minTime = self.dfGraph['t'].min() 
        maxTime = self.dfGraph['t'].max()
        totalNumberTimestamps = maxTime - minTime + 1 


        temp_obj = {}
        temp_obj['numberNodes'] = len(self.graph.nodes())
        temp_obj['numberEdges'] = len(self.graph.edges())
        temp_obj['numberTimes'] = repr(totalNumberTimestamps)
        temp_obj['nodeAttributes'] = self.node_attributes
        temp_obj['edgeAttributes'] = self.edge_attributes

        start = time.time()
        resolution = Resolution()

        #avg, median, min, max resolutions computed by Adaptive Resolution for fadingfactors 0.9, 0.99, 0.999
        #resolutionsFadingFactor09 = resolution.computeAdaptiveResolution(self.dfGraph, 0.9)
        #resolutionsFadingFactor099 = resolution.computeAdaptiveResolution(self.dfGraph, 0.99)
        #resolutionsFadingFactor0999 = resolution.computeAdaptiveResolution(self.dfGraph, 0.999)
        #resolutionsFadingFactor09999 = resolution.computeAdaptiveResolution(self.dfGraph, 0.9999)

        #Comentado para Lucas SBSI
        #resolutionsFadingFactor1 = resolution.computeAdaptiveResolution(self.dfGraph, 1)

        #output = []
        #output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor09, totalNumberTimestamps))
        #output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor099, totalNumberTimestamps))
        #output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor0999, totalNumberTimestamps))
        #output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor09999, totalNumberTimestamps))
        
        #Comentado para Lucas SBSI
        #output.append(resolution.computeNumberTimeslicesFromResolutions(resolutionsFadingFactor1, totalNumberTimestamps, 2))

        #print(output)


        temp_obj['suggestedNumberTimeslices'] = [20]


        end = time.time()
        print('....time to compute adaptive resolution .......')
        print(end - start,' seconds')
        print('')

        return json.dumps(temp_obj)

    def sampleGraph(self, samplingMethod, percentage):
        sampling = Sampling()
        if samplingMethod == "nodeRandomSampling":
            self.dfGraph, self.graph = sampling.nodeRandomSampling(self.dfGraph, self.graph, percentage)
        elif samplingMethod == "edgeRandomSampling":
            self.dfGraph, self.graph = sampling.edgeRandomSampling(self.dfGraph, percentage)
        #elif samplingMethod == "snowballSampling":
        #    self.dfGraph, self.graph = sampling.snowballSampling(self.dfGraph, percentage)

    def getDf(self):
        return self.dfGraph

    def getGraph(self):
        return self.graph

    def getNodeMetadataDf(self):
        return self.dfNodeMetadata

    def getNodeExtraMetadata(self):
        return self.dfNodeExtraMetadata

    def getgraphEdgeLabels(self):
        return self.uniqueEdgeLabels

    def getKeyByValue(self, mydict, value):
        return (list(mydict.keys())[list(mydict.values()).index(value)])

    # DIVIDE TIMESLICES INTO DATAFRAMES
    def divide_df_timeslices(self, df, number_timeslices=10):
        min_t = min(df['t'])
        max_t = max(df['t'])
        total_t = max_t - min_t
        value_timeslice = round(total_t/number_timeslices)
        list_dfs = {}
        i = 0

        generatedTimeslices = []

        while i < number_timeslices: 
            if i == 0:
                max_t = value_timeslice
                min_t = min(df['t'])
            if i == (number_timeslices - 1):
                max_t = max(df['t']) + 1
            df_temp = df[(df['t'] >= min_t) & (df['t'] < max_t)]
            key = str(min_t) + ' ' + str(max_t - 1)
            generatedTimeslices.append(key)
            list_dfs[key] = df_temp

            min_t = max_t
            max_t = max_t + value_timeslice
            i = i + 1

        return generatedTimeslices, list_dfs

    def calculateLouvain(self, list_dfs, minimumCommunitySize, seed=1):

        list_partition = {}
        dict_commun_graph = {}
        list_graphs = []
        list_interval_partitions = {}
        i = 1

        modularity_result = []
        total_numberCommunities = 0

        nodeDegreeNormalized = {}
        nodeBetweennessNormalized = {}
        nodeClosenessNormalized = {}
        
        # contains two timeslices and a dataframe of these timeslices
        itemDf =  next(iter(list_dfs.items()))

        edge_attrs = list(itemDf[1].keys())[2:]

        for key, df_temp in list_dfs.items():
            
            G = nx.MultiGraph()
            G = nx.from_pandas_edgelist(df_temp, 'node_id1', 'node_id2', edge_attr=edge_attrs, create_using=nx.MultiGraph())

            # # Print information about nodes
            # print("Nodes linha 164:")
            # for node, data in G.nodes(data=True):
            #     print(f"Node {node}: {data}")

            # # Print information about edges
            # print("Edges linha 169:")
            # for edge in G.edges(data=True):
            #     print(f"Edge {edge[:2]}: {edge[2]}")

            # compute the best partition
            partition = community_louvain.best_partition(G.to_undirected(), randomize=None, random_state=seed)

            
            sampling = Sampling()
            partition, G = sampling.communities_by_size_Sampling(partition, G, minimumCommunitySize)

            if partition:
                all_values = partition.values()
                max_value = max(all_values)+1
                modul = community_louvain.modularity(partition, G.to_undirected())

                dict_commun_graph[key] = self.splitGraph(G, partition)

            else:
                max_value = 0
                modul = 0

            G_3 = nx.Graph(G)
            if G_3:

                nodeDegreeNormalized[key] = nx.degree_centrality(G_3)
                for node in nodeDegreeNormalized[key]:
                    nodeDegreeNormalized[key][node] = round(nodeDegreeNormalized[key][node], 3)

               
                nodeBetweennessNormalized[key] = nx.betweenness_centrality(G_3, math.floor(G_3.number_of_nodes() * 0.25))
                #nodeBetweennessNormalized[key][node] = -1 #TODO - comentar essa linha e descomentar as de baixo.
                for node in nodeBetweennessNormalized[key]:
                     nodeBetweennessNormalized[key][node] = round(nodeBetweennessNormalized[key][node], 3)

                
                nodeClosenessNormalized[key] = nx.closeness_centrality(G_3)
                #nodeClosenessNormalized[key] = -1 #TODO - comentar essa linha e descomentar a de cima
                for node in nodeClosenessNormalized[key]:
                   nodeClosenessNormalized[key][node] = round(nodeClosenessNormalized[key][node], 3)


            total_numberCommunities = total_numberCommunities + max_value

            if(max_value != 0):
                modularity_result.append(modul)

            list_interval_partitions[i] = key
            list_graphs.append(G)
            list_partition[i] = (partition)
            i = i+1
        #print(' ')
        #print('MODULARITY MEAN: ',mean(modularity_result))

        return nodeDegreeNormalized, nodeBetweennessNormalized, nodeClosenessNormalized, total_numberCommunities, mean(modularity_result), list_partition, list_graphs, list_interval_partitions, dict_commun_graph

    # not working, have to be adapted to the dataframes as input
    def calculateInfomap(self, G, seed):

        x = "--seed "+str(seed)
        im = Infomap(" "+x)

        # CONVERTE OS NODES IDS PARA ADICIONAR NO INFOMAP
        nodes_to_id = {}

        id_new = 0
        for row in G.edges():
            
            if row[0] not in nodes_to_id:
                nodes_to_id[row[0]] = id_new
                id_new = id_new + 1
            if row[1] not in nodes_to_id:
                nodes_to_id[row[1]] = id_new
                id_new = id_new + 1
            # Add weight as optional third argument
            im.add_link(nodes_to_id[row[0]], nodes_to_id[row[1]])

        # Run the Infomap search algorithm to find optimal modules
        im.run()

        partition = {}
        for node in im.tree:
            if node.is_leaf:
                a = getKeyByValue(nodes_to_id, node.node_id)
                partition[a] = node.module_id
        
        return partition
        
    # CONVERTE O RESULTADO DO CLUSTER PARA UM FORMATO DE TUPLA = CONVERTS THE CLUSTER RESULT TO A TUPLE FORMAT
    def convert_cluster_tuple(self, list_graphs, list_partition):
        timeslice = 1
        list_input_ET = []
        i = 0
        dict_ids_return = {}
        dict_ids_communities = {}
        for graph in list_graphs:
            dict_ids_cluster = {}
            for node in graph.nodes():
                key = list_partition[timeslice][node]
                
                if key not in dict_ids_cluster:

                    if timeslice not in dict_ids_return:
                        dict_ids_return[timeslice] = [i]
                    elif i not in dict_ids_return[timeslice]:
                        dict_ids_return[timeslice].append(i)

                    dict_ids_cluster[key] = i
                    i = i+1
                    
                #print(node,timeslice, list_partition[timeslice][node])
                #tuple format = (node, timeslice, community id)
                
                dict_ids_communities[(node,timeslice)] = dict_ids_cluster[key]

                list_input_ET.append((node,timeslice,dict_ids_cluster[key]))
            timeslice = timeslice+1
        return list_input_ET, dict_ids_return, dict_ids_communities

    def findGroups(self, list_dfs, method, minimumCommunitySize):
        if method == 'louvain':
            nodeDegreeNormalized,nodeBetweennessNormalized, nodeClosenessNormalized, total_numberCommunities, avg_modularity, list_partition, list_graphs, list_interval_partitions, dict_commun_graph = self.calculateLouvain(list_dfs, minimumCommunitySize)

        #elif method == 'infomap':
            #partition = self.calculateInfomap(G,1)
        
        list_input_ET, dict_ids_return, dict_ids_communities = self.convert_cluster_tuple(list_graphs,list_partition)

        return nodeDegreeNormalized, nodeBetweennessNormalized, nodeClosenessNormalized, total_numberCommunities, avg_modularity, dict_commun_graph, list_input_ET, dict_ids_return, dict_ids_communities

    def splitGraph(self, G, partition):
        # DIVIDE CADA RESULTADO DA COMUNIDADE EM UM GRAFO SEPARADO, REMOVENDO AS ARESTAS ENTRE COMUNIDADES
        # Resultado algoritmo de detecção de comunidade = partition

        dict_commun_graph = {}
        edge_list = []

        G_2 = nx.Graph(G)

        for row in G_2.edges(): # we use G_2 to have the unique list of edges to optimize the code
            if partition[row[0]] == partition[row[1]]:
                if partition[row[0]] not in dict_commun_graph:
                    dict_commun_graph[partition[row[0]]] = []

                edge_list = G.get_edge_data(row[0], row[1])
                
                for edge_time in edge_list:
                    dict_commun_graph[partition[row[0]]].append([row[0], row[1], edge_list[edge_time]['t'], list(edge_list.values())[0]])
        
        return dict_commun_graph

    # INPUT: dict_commun_graph = dictionary of list of temporal edges resulting from the community partition
        # number_timeslices (optional) = number of how many timeslices the windows will be divided, default value = 5
    # OUTPUT: new dicionary with edges list divided by timeslices
    def divide_timeslices(self,dict_commun_graph, number_timeslices=5):
        min_t = min(self.df['t'])
        max_t = max(self.df['t'])
        total_t = max_t - min_t
        value_timeslice = round(total_t/number_timeslices)

        # Divide the communities into X number of times slices:
        dict_timeslice_graph = {}

        key_timeslice = 0
        for key in sorted(dict_commun_graph):
            #print('\r\ncommunity ',key)
            i = 0
            while i < number_timeslices: 
                #print()
                dict_timeslice_graph[key_timeslice] = []
                if i == 0:
                    max_t = value_timeslice
                    min_t = min(self.df['t'])
                if i == (number_timeslices - 1):
                    max_t = max(self.df['t']) + 1

                # Values from the temporal window are from min_t to max_t
                com = dict_commun_graph[key]
                        
                count_com = 0
                for c in com:
                    if (c[2] >= min_t) & (c[2] < max_t):
                        dict_timeslice_graph[key_timeslice].append(c)
                        count_com = count_com + 1

                            
                min_t = max_t
                max_t = max_t + value_timeslice

                i = i + 1
                key_timeslice = key_timeslice + 1
        return dict_timeslice_graph

    def generateGraphsFromGroups(self, dict_commun_graph):
        
        graph_lists = {}
        fixedCollumns = ['node_id1', 'node_id2', 't']
        
        for key in dict_commun_graph:  # key contains the timeslice range (mintime maxtime)
            coms = dict_commun_graph[key]
            
            # Extracting the desired dictionary (for edge attributes)
            desired_dict = coms[0][0][3]
            
            aditionalCollumns = list(desired_dict.keys())
            # moreCollumns = list(desired_dict.values())
            # print("keys:", aditionalCollumns)
            # print("values:", moreCollumns)
            
            graph_lists[key] = []

            for keyLocal in coms:
                com = coms[keyLocal]

                for inner_list in com:
                    # Extract values from the dictionary present in "com"
                    values = list(inner_list[-1].values())[1:]
                    # Delete the dictionary
                    del inner_list[-1]
                    # Append the values in place
                    inner_list.extend(values)
            
                temporary_df = DataFrame(com,columns = fixedCollumns + aditionalCollumns[1:])
                
                #if(len(temporary_df.index) < 5): #discard any community with less than 5 edges.
                    #continue

                temporary_graph = nx.MultiGraph()
                temporary_graph = nx.from_pandas_edgelist(temporary_df, 'node_id1', 'node_id2', edge_attr=aditionalCollumns, create_using=nx.MultiGraph())

                graph_lists[key].append(temporary_graph)
        return graph_lists