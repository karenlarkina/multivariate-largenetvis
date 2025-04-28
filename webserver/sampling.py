import numpy as np
import time as time_lib
import random

import math
import statistics

import pandas as pd
import networkx as nx
from sqlalchemy import null

#import Graph_Sampling 

class Sampling:

    #percentage variable refers to the amount of percentage of the data that will REMOVE of the original data
    #percentage = 10, i.e. remove 10% of the original data
    def nodeRandomSampling(self, df_original, G_original, percentage):

        #percentage = 100 - percentage

        df = df_original
        l = list(G_original.nodes)
        size_list = round((len(l) * (percentage/100)))
        l_sampled = random.sample(l, size_list)

        #print('SIZE LIST: ', size_list)
        #print('PERCENTAGE: ', percentage)
        #print('SAMPLINGGGGGGG:   ',len(l), len(l_sampled))

        #print('DF size: ',len(df))

        df = df[~df['node_id1'].isin(l_sampled)]
        df = df[~df['node_id2'].isin(l_sampled)]

        
        #print('DF size after: ',len(df))

        G_original = G_original.remove_nodes_from(l_sampled)

        return df, G_original

    def edgeRandomSampling(self,df_original, percentage):
        df = df_original
        fraction = 1 - (percentage / 100)

        print(fraction)
        print('DF size after: ', len(df))

        df = df.sample(frac=fraction)

        G = nx.MultiGraph()
        G = nx.from_pandas_edgelist(df, 'node_id1', 'node_id2', edge_attr='t', create_using=nx.MultiGraph())

        print('DF size before: ', len(df))

        return df, G

    #NEED TO INSTALL #pip install Graph_Sampling-master.zip
    #Zip downloaded from: https://github.com/Ashish7129/Graph_Sampling#readme
    #Examples: https://github.com/Ashish7129/Graph_Sampling/blob/master/test.py

    #Opcao de comando: pip install -e git+https://github.com/Ashish7129/Graph_Sampling

    #Snowball sampling for estimating exponential random graph models for large networks
    #Alex D. Stivalaa, Johan H. Koskinenb, David A. Rollsa, Peng Wanga, Garry L. Robinsa
    #2016, Social Networks
    #def snowballSampling(self,df_original, percentage):
    #    df = df_original
    #    fraction = 1 - (percentage / 100)

    #    print(fraction)
    #    print('DF size after: ', len(df))
        
    #    df = df.sample(frac=fraction)

    #    G = nx.MultiGraph()
    #    G = nx.from_pandas_edgelist(df, 'node_id1', 'node_id2', edge_attr='t', create_using=nx.MultiGraph())

    #    G_2 = nx.Graph(G)
    #    G_2 = nx.convert_node_labels_to_integers(G_2)

    #    object3=Graph_Sampling.Snowball()
    #    sample3 = object3.snowball(G_2,1,25) # graph, number of nodes to sample , k set
    #    print("Snowball Sampling:")
    #    print("Number of nodes sampled=",len(sample3.nodes()))
    #    print("Number of edges sampled=",len(sample3.edges()))

    #    nodeId_dict = dict(zip(list(G_2.nodes()), list(G.nodes())))
    #    lst = list(sample3.nodes())
    #    lst = [nodeId_dict[i] for i in lst]

    #    df = df[~df.node_id1.isin(lst)]
    #    df = df[~df.node_id2.isin(lst)]

    #    print('DF size before: ', len(df))

    #    return df, G_2

    def communities_by_size_Sampling(self, partition, G, minimumCommunitySize):

        #Preparing code for Sampling of communities
        inv_map = {}
        for k, v in partition.items():
            inv_map[v] = inv_map.get(v, []) + [k]

    
        list_removed_communities_ids = []
        map_new_ids_partitions = {}
        count = 0
        for k, v in inv_map.items():
            if(len(v) <= minimumCommunitySize):
                list_removed_communities_ids.append(k)
            else:
                map_new_ids_partitions[k] = count
                count += 1
        list_keys_to_remove = []
        for k, v in partition.items():
            if(v in list_removed_communities_ids):
                list_keys_to_remove.append(k)
            else:
                v = map_new_ids_partitions[v]
        
        for k in list_keys_to_remove:
            partition.pop(k, None)
    
        G.remove_nodes_from(list_keys_to_remove)

        #print('SAMPLING COMMUNITIES: ', list_removed_communities_ids, map_new_ids_partitions)
        #print('RESULT LOUVAIN SAMPLED: ', partition)

        return partition, G