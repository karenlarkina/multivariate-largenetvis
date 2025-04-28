import pandas as pd
import numpy as np
import networkx as nx
from resolution import Resolution
from sampling import Sampling
import os

  
class FileManager:

    #### readGraphFile old version (does not read edge data) ####

    # def readGraphFile(self, networkfolder, networkfilename):
    #     col = ['node_id1','node_id2','t']
    #     #print(networkfolder + "/" + networkfilename)

    #     df = pd.read_csv(networkfolder + '/' + networkfilename + '.dat', sep=' ', names= col)
    #     #df = pd.read_csv('../datasets/HighSchool.dat', sep=' ', names= col)
    #     #df = pd.read_csv('../datasets/primarySchool.dat', sep=' ', names= col)
    #     #df = pd.read_csv('../datasets/hospital.dat', sep=' ', names= col)
    #     #df = pd.read_csv('../datasets/sex_dy_1.dat', sep=' ', names= col)

    #     #df = pd.read_csv(networkfolder + "/" + networkfilename, sep=' ', names= col)
        
        

    #     #df = resolution.applyUniformResolution(df,30)

    #     #print(df.head())
        
    #     #Create the network with Time
    #     G = nx.MultiGraph()
    #     G = nx.from_pandas_edgelist(df, 'node_id1', 'node_id2', edge_attr='t', create_using=nx.MultiGraph())
    #     #print(len(G.nodes()),len(G.edges()))

        
    #    # sampling = Sampling()
    #    # df, G = sampling.edgeRandomSampling(df,10)
    #    # df, G = sampling.nodeRandomSampling(df,G, 5)


    #     return df, G

    def readNodeMetadataFile(self, networkfolder, networkfilename, nodeMetadatafilename):

        col = ['nodeId','category']

        if networkfolder == '':
            df = pd.read_csv(f"../datasets/{networkfilename}/{nodeMetadatafilename}.txt", sep=' |\t', names= col, skiprows=1)

        elif networkfolder != '':
            df = pd.read_csv(f"{networkfilename}/{nodeMetadatafilename}.txt", sep=' |\t', names= col)

        
        #df = pd.read_csv('../datasets/HighSchoolClasses.txt', sep=' ', names= col)
        #df = pd.read_csv('../datasets/schoolClasses.txt', sep=' ', names= col)
        #df = pd.read_csv('../datasets/hospital_dept_list.txt', sep=' ', names= col)
        #df = pd.read_csv('../datasets/sex_dy_1_nodeMetadata.txt', sep=' ', names= col)
        
        #df = pd.read_csv(networkfolder + "/" + nodeMetadatafilename, sep=' ', names= col)
        #print(df.tail())
        return df

    def readNodeExtraMedataFile(self, networkfolder, networkfilename, nodeExtraMetadataFilename):

        if networkfolder == '':
            df = pd.read_csv(f"../datasets/{networkfilename}/{nodeExtraMetadataFilename}.txt", sep='\t')

        elif networkfolder != '':
            df = pd.read_csv(f"{networkfilename}/{nodeExtraMetadataFilename}.txt", sep='\t')
        
        # Getting column names
        column_names = df.columns.tolist()

        # df = pd.read_csv(networkfolder + '/' + nodeExtraMetadataFilename + '.txt', sep='\t')
        return df

    def readGraphFile(self, networkfolder, networkfilename, edge_attribute):

        if networkfolder == '':
            # Read the first line to get the column names
            with open(f"../datasets/{networkfilename}/{networkfilename}.dat", 'r') as file:
                first_line = file.readline().strip()
            column_names = first_line.split()
            df = pd.read_csv(f"../datasets/{networkfilename}/{networkfilename}.dat", sep=' ')
            node_attributes, edge_attributes = self.getNodeEdgeAttributesFromGraphFolder(networkfilename)

        elif networkfolder != '':
            # Read the first line to get the column names
            with open(f"{networkfolder}/{networkfilename}.dat", 'r') as file:
                first_line = file.readline().strip()
            column_names = first_line.split()
            df = pd.read_csv(f"{networkfolder}/{networkfilename}.dat", sep=' ')
        
        # Split the first line to get the column names
        # column_names = first_line.split()

        # Define the fixed column names
        fixed_cols = ['node_id1', 'node_id2', 't']

        if edge_attribute != '':
            df = df.rename(columns={f"{edge_attribute}": "label"})
            cols = list(df.columns)
            cols.remove('label')
            new_order = cols[:3] + ['label'] + cols[3:]
            df = df[new_order]
            column_names = new_order
    
        # Read the file into a DataFrame, skipping the first line (headers)
        # df = pd.read_csv(f"{networkfolder}/{networkfilename}.dat", sep=' ')

        if len(column_names) > len (fixed_cols):
            # generate graph
            G = nx.MultiGraph()
            G = nx.from_pandas_edgelist(df, 'node_id1', 'node_id2', edge_attr=column_names[3:], create_using=nx.MultiGraph())
        else:
            # generate graph
            G = nx.MultiGraph()
            G = nx.from_pandas_edgelist(df, 'node_id1', 'node_id2', edge_attr=fixed_cols, create_using=nx.MultiGraph())
        
        # Collecting unique edge labels
        uniqueEdgeLabels = set()
        for (u, v, data) in G.edges(data=True):
            if 'label' in data:
                uniqueEdgeLabels.add(data['label'])

        # # Display the uniqueEdgeLabels
        # print(uniqueEdgeLabels)

        # Extracting all edge data
        allEdgeData = list(G.edges(data=True))

        # Displaying the edge data
        # for edge in edge_data:
        #     print(edge)
            
        # # # Print network information
        # print('NX INFO filemanager  line 112',nx.info(G))
        # # Print information about nodes
        # print("Nodes:")
        # for node, data in G.nodes(data=True):
        #     print(f"Node {node}: {data}")

        # # Print information about edges
        # print("Edges:")
        # for edge in G.edges(data=True):
        #     print(f"Edge {edge[:2]}: {edge[2]}")

        return df, G, uniqueEdgeLabels, node_attributes, edge_attributes

    def getNodeEdgeAttributesFromGraphFolder(self, folder_name):
        node_label_files = [f for f in os.listdir(f"../datasets/{folder_name}") if "nodeLabels" in f]
        node_attributes = []
        for file in node_label_files:
            df = pd.read_csv(f"../datasets/{folder_name}/{file}", sep=" |\t")  
            if len(df.columns) > 1: 
                node_attributes.append({'name': df.columns[1], 'value': os.path.splitext(file)[0]})

        edge_label_file = [f for f in os.listdir(f"../datasets/{folder_name}") if folder_name in f]
        edge_attributes = []
        for file in edge_label_file:
            df = pd.read_csv(f"../datasets/{folder_name}/{file}", sep=" |\t")
            if len(df.columns) > 3:
                for i in range(3, len(df.columns)):
                    edge_attributes.append({'name': df.columns[i], 'value': df.columns[i]}) 

        return node_attributes, edge_attributes
