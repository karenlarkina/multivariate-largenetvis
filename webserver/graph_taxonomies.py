import networkx as nx
import statistics
from statistics import mean, mode, median
import math
from scipy import stats as s
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
import numpy as np
import itertools
#imports to evolution taxonomy:
from evolutionTaxonomy.transition import match_communities, create_confusion_matrix, create_continuation_matrix, find_rebirths, State, vi
from evolutionTaxonomy.constants import *
from evolutionTaxonomy.network import Community, Nodes
from evolutionTaxonomy.user_specifications import jaccard_null_model
from evolutionTaxonomy.output_v2 import printouts
import collections
#from input_csv import ReadData  # read one record at a time (time stamp/ node / community)
#from input import ReadData


class Structural_Taxonomy:

    def has_cycle(self, G):
        if len(nx.find_cycle(G)) > 0:
            return True
        return False
            
    def is_circular(self, G):
        n = len(G.nodes())
        c = len(nx.find_cycle(G))
        if (c > 0) & (c == n):
            return True
        return False

    def is_complete(self, G):
        n = len(G.nodes())
        e = len(G.edges())
        
        #n(n-1)/2, where n = number of nodes
        formula = n * (n-1)/2
        
        if e == formula:
            return True
        return False

    def is_low_connectivity(self, G):
        if ~is_complete_graph(G) & ~is_circular(G) & ~nx.is_tree(G) & ~nx.is_forest(G):
            return True
        return False


    def is_star(self,G):
        a = [x for x in G.nodes() if G.degree(x)==1]
        if len(a) > 0.8 * len(G.nodes()):
            return True
        else:
            return False


    # A recursive function that uses
    # visited[] and parent to detect
    # cycle in subgraph reachable from vertex v.
    def isCyclicUtil(self,v,visited,parent):
 
        # Mark the current node as visited
        visited[v]= True
 
        # Recur for all the vertices
        # adjacent to this vertex
        for i in self.graph[v]:
             
            # If the node is not
            # visited then recurse on it
            if  visited[i]==False :
                if(self.isCyclicUtil(i,visited,v)):
                    return True
            # If an adjacent vertex is
            # visited and not parent
            # of current vertex,
            # then there is a cycle
            elif  parent!=i:
                return True
         
        return False

    # Returns true if the graph
    # contains a cycle, else false.
    def isCyclic(self):
       
        # Mark all the vertices
        # as not visited
        visited =[False]*(self.V)
         
        # Call the recursive helper
        # function to detect cycle in different
        # DFS trees
        for i in range(self.V):
           
            # Don't recur for u if it
            # is already visited
            if visited[i] ==False:
                if(self.isCyclicUtil
                       (i,visited,-1)) == True:
                    return True
         
        return False

    def hasCycle(self,G):
        cycls = [c for c in nx.cycle_basis(G) if len(c) > 3]
        if(len(cycls) > 0):
            return True
        else:
            return False


    #def hasClique(self,G):
    #    cliques = [s for s in nx.enumerate_all_cliques(G) if len(s) > 3]
    #    if(len(cliques) > 0):
    #        return True
    #    else:
    #        return False
    

    def find_cliques_size_k(self,G, k):
        i = 0
        for clique in nx.find_cliques(G):
            if len(clique) == k:
                i += 1
                return True #To count the number of cliques, just comment this line and return i
            elif len(clique) > k:
                i += len(list(itertools.combinations(clique, k)))
        return False


    def hasClique(self,G):
        if(self.find_cliques_size_k(G,3) == True):
            return True
        else:
            return False
            # return self.find_cliques_size_k(G,5)
        



    def graph_topology_has(self,G):
        G_2 = nx.Graph(G) #transform multigraph (G) into graph (G_2) to calculate the topology
        if self.hasClique(G_2):
            return 'complete'
        elif self.is_star(G_2):
            return 'star'
        elif self.hasCycle(G_2):
            return 'circular'
        elif nx.is_tree(G_2):
            return 'tree'
        elif nx.is_forest(G_2):
            return 'tree'
        else:
            return 'low_connectivity'

        
    def graph_topology(self,G):
        G_2 = nx.Graph(G) #transform multigraph (G) into graph (G_2) to calculate the topology
        if len(G_2.nodes()) == 0:
            return 'no_connectivity'
        elif  self.is_star(G_2):
            return 'star'
        elif nx.is_tree(G_2):
            return 'tree'
        elif nx.is_forest(G_2):
            return 'tree'
        elif self.is_circular(G_2):
            return 'circular'
        elif  self.is_complete(G_2):
            return 'complete'
        else:
            return 'low_connectivity'

    def graph_topology_new(self,features,n_clust):
                
        scaler = StandardScaler()
        scaled_features = np.array(features)

        #0 = circular, 1 = complete, 2 = star, 3 = tree, 4 = low_connectivity
        data = [[0.0, 1.0, 0.0] ,[0.0, 0.0, 1.0],[0.5, 0.0, 0.0],[0.0, 0.5, 0.0],[0.0, 0.0, 0.0]]
        centroids  = np.array(data)
        
        #https://stackoverflow.com/questions/60205100/define-cluster-centers-manually
        kmeans = KMeans(
            init=centroids,
            n_clusters=n_clust,
            max_iter=1,
        )
        kmeans.fit(scaled_features)
        kmeans_silhouette = silhouette_score(scaled_features, kmeans.labels_).round(2)  
        #print('inertia: ',kmeans.inertia_, ' silhouette: ',kmeans_silhouette)
            
        new_labels = []
        for label in kmeans.labels_:
            if label == 0:
                new_labels.append('circular')
            elif label == 1:
                new_labels.append('complete')
            elif label == 2:
                new_labels.append('star')
            elif label == 3:
                new_labels.append('tree')
            elif label == 4:
                new_labels.append('low_connectivity')
                
        return new_labels


    #\alpha = \frac{\max(e_i)}{\sum e_i}, 
    #\beta = \frac{count(e_i=2)}{n}, 
    #\delta = \frac{1}{n}count(e_i > \frac{n}{2}), 
    #where e_i denotes the neighbor count of node i and n denotes the node count of the module. 
    def graph_feature_vector(self,G):
        if len(G.nodes()) == 0:
            return [0.0,0.0,0.0]
        G_2 = nx.Graph(G) #transform multigraph (G) into graph (G_2) to calculate the feature
        e_i = []
        for i in G_2.nodes():
            e_i.append(len(list(G_2.neighbors(i))))
        n = len(G_2.nodes())
        
        count_beta = 0
        count_delta = 0
        for ee in e_i:
            if ee == 2:
                count_beta = count_beta + 1
            if ee > (n/2):
                count_delta = count_delta + 1

        alpha = round(max(e_i)/sum(e_i),2)
        beta = round(count_beta / n,2)
        delta = round((1/n) * count_delta,2)
        
        return [alpha,beta,delta]


class Temporal_Taxonomy:

    global porcentage_temporal_tax
    porcentage_temporal_tax = 0.1

    def get_timestamps(self,G):
        edges=sorted(G.edges(data='t'), key=lambda t: t[2])
        timestamp_list = []
        for e in edges:
            timestamp_list.append(e[2])
            
        return timestamp_list
      
    #t_m is an optional parameter to divide timestamps
    def time_frequency(self,G, min_t, max_t, t_m=-1):
        #if len(G.nodes()) == 0:
            #return 'no_temporal'
        t_list = self.get_timestamps(G)

        #A cada 10% (percent_evaluated_timeslice) é necessario existir ao menos uma aresta para ser contínuo, caso contrario, é esporádico
        percent_evaluated_timeslice = math.ceil((max_t - min_t) * porcentage_temporal_tax )

        while min_t < max_t:
            max_t_interval = min_t + percent_evaluated_timeslice

            a = [i for i in t_list if (i >= min_t) & (i < max_t_interval) ]
            #print('PRINT A: ', a)
            if(len(a) == 0):
                return 'sporadic'

            min_t += percent_evaluated_timeslice
            #print('MIN_TEMP: ',min_t)

        return 'continuous'
        
    def find_max_mode(self,list1):
        list_table = statistics._counts(list1)
        len_table = len(list_table)

        if len_table == 1:
            max_mode = mode(list1)
        else:
            new_list = []
            for i in range(len_table):
                new_list.append(list_table[i][0])
            max_mode = max(new_list) # use the max value here
        return max_mode

    #Tem que existir muitas arestas juntas consecutivamente 

    #def calculate_dispersion(self,G, min_t, max_t):
        #t_list = self.get_timestamps(G)
        #occurrences = collections.Counter(t_list)

        #print('TIME INTERVALLLLLLL: ', occurrences, occurrences.most_common(1)[0][0], occurrences.most_common(1)[0][1])
 
        #highest_y_timeslice = occurrences.most_common(1)[0][1]

        #percentage_y_threshold = highest_y_timeslice / 2

        #percent_evaluated_timeslice = math.ceil((max_t - min_t) * 0.33 )

        #while min_t < max_t:
            #max_t_interval = min_t + percent_evaluated_timeslice

            #Pega o valor de count de todos os elementos entre o min_t e max_t_interval
            #a = [j for i,j in occurrences.items() if (i >= min_t) & (i < max_t_interval) ]
            #print('PRINT A: ', min_t, max_t_interval)
            #if(len(a)!= 0):
             #   print(mean(a),' > ',percentage_y_threshold) 
            #print(a)
            #Faz a media desses valores e verifica se são maiores que "percentage_y_threshold", ou seja,
            #Verifica se existe uma atividade (count de edges) significativa naquele intervalo.
            #Caso tenha 1 intervalo com "alta atividade", ele é classificado em agrupado. Caso contrário, é contínuo.
            #if(len(a)!= 0):
           #     if(mean(a) > percentage_y_threshold):
          #          return 'grouped'
            
         #   min_t += percent_evaluated_timeslice

        #return 'dispersed'
        
        #if len(time_interval) == 0:
        #    tdg = 0
        #else:
        #    tdg = round(self.find_max_mode(time_interval))
        #t_h = 0.3
        #print('mode',tdg)
        
        #consecutive_interval_value = math.ceil(len(t_list) * t_h) #quantidade de instantes de tempo consecutivos que tem que ter pouco intervalo

        #print('consecutive_interval_value',consecutive_interval_value, t_h, tdg, time_interval)
        
        #count=0
        #for i in time_interval:
        #    if count == consecutive_interval_value:
        #        return 'grouped'
        #    if i <= tdg:
        #        count = count+1
        #    else:
        #        count = 0
        
        #return 'dispersed'


    #Activity Dispersion - Dispersed or Grouped
    #Suggestion: Activity Dispersion - Burst or Dispersed (?) Peak or Valley (?)
    #A community has grouped activity if the majority of consecutive edges is too close to each other (according to a threshold T_dg ),
    #or has dispersed activity otherwise.
    #T_dg = The most frequent median time interval between two consecutive connections (mode of the medians)

    #Tem que existir muitas arestas juntas consecutivamente
    def calculate_dispersion_old(self,G, min_t, max_t):
        t_list = self.get_timestamps(G)
        i = -1
        time_interval = []
        time_interval.append(min_t)
        for t in t_list:
            if i == -1:
                i = t
            else:
                time_interval.append(t-i)
                i=t
        time_interval.append(max_t)

        if len(time_interval) == 0:
            tdg = 0
        else:
            tdg = round(self.find_max_mode(time_interval))
        t_h = 0.3
        #print('mode',tdg)
        
        #consecutive_interval_value = math.ceil(len(t_list) * t_h) #quantidade de instantes de tempo consecutivos que tem que ter pouco intervalo
        consecutive_interval_value = math.ceil(len(t_list) * t_h) #quantidade de instantes de tempo consecutivos que tem que ter pouco intervalo

        #print('consecutive_interval_value',consecutive_interval_value, t_h, tdg, time_interval)
        
        count=0
        for i in time_interval:
            if count == consecutive_interval_value:
                return 'grouped'
            if i <= tdg:
                count = count+1
            else:
                count = 0
        
        return 'dispersed'




    def calculate_dispersion(self,G, min_t, max_t):
        porcentage_temporal_dispersion = 0.6

        t_list = self.get_timestamps(G)
        t = min_t
        list_empty_timestamps = []
        new_empty_list = []
        while t < max_t:
            temp_t = t
            t += 1
            a = [i for i in t_list if (i >= temp_t) & (i < t)]
            
            if(len(a) == 0):
                new_empty_list.append(0)
            else:
                if(len(new_empty_list) > 1):
                    list_empty_timestamps.append(len(new_empty_list))
                    new_empty_list = []

        if(len(new_empty_list) > 1):
            list_empty_timestamps.append(len(new_empty_list))
            new_empty_list = []

        if(len(list_empty_timestamps)==0):
            return 'grouped'
        
        bigger_empty_list = max(list_empty_timestamps)
        percent_evaluated_timeslice = math.ceil((max_t - min_t) * porcentage_temporal_dispersion )
        
        #print('AQUIIIIIII ',list_empty_timestamps, bigger_empty_list, percent_evaluated_timeslice)

        if(bigger_empty_list > percent_evaluated_timeslice):
            return 'grouped'
        else:
            return 'dispersed'


    def graph_topology(self, G, min_t, max_t):
        return self.time_frequency(G, min_t, max_t), self.calculate_dispersion(G, min_t, max_t)


class Evolution_taxonomy:

    """
    main module: inspects a list of timed node community assignments and outputs the community lifecycles
    ref: Community identity in a temporal network: A taxonomy proposal submitted to Ecological Complexity, Pereira et al
    """

    def calculate_evolution_taxonomy(self,list_input_ET,sigma):
        #eof, timestamp, node_number, community_name = return_single_node()
        new_communities = []
        dead_communities = []
        nodes = []
        states = []
        states_count = []

        # tuple format = (node, timeslice, community id)

        i = 0
        tam = len(list_input_ET)

        timestamp = list_input_ET[i][1]
        node_number = list_input_ET[i][0]
        community_name = list_input_ET[i][2]

        return_evolution_taxonomy = []
        while i < tam:

            #print(tuplet[0],tuplet[1],tuplet[2])

            time_slice_previous = timestamp
            new_communities.append([])    # initiate a new community set
            while timestamp == time_slice_previous:
                Ts.timestamp = timestamp            # Ts.timestamp global used by objects
                

                #print(i, tam)
                
                #print('EEEEEEEEE',[c.community_name for c in new_communities[-1]],community_name)
                
                if(community_name not in [c.community_name for c in new_communities[-1]]):
                    index = -1
                    new_community = Community(0, community_name)
                    new_communities[-1].append(new_community)
                else:
                    index = [c.community_name for c in new_communities[-1]].index(community_name)
                
                new_communities[-1][index].total_nodes += 1
                exists, node, _ = Nodes.is_node(node_number)
                if not exists:
                    node = Nodes(new_communities[-1][index], node_number)
                else:
                    node.change_community(new_communities[-1][index])
                node.set_lifecycle()
                new_communities[-1][index].nodes.append(node)

                #eof, timestamp, node_number, community_name = return_single_node()

                if i == tam:
                    break

                timestamp = list_input_ET[i][1]
                node_number = list_input_ET[i][0]
                community_name = list_input_ET[i][2]

                i = i+1
                
                # find frequent clusterings
                state_names = (';'.join(map(str, sorted([comm.community_name for comm in new_communities[-1]]))))
                
            #print(states_count[states.index(state_names)])
            
            if state_names not in states:
                states.append(state_names)
                states_count.append(1)
            else:
                states_count[states.index(state_names)] += 1
            
            #try:
            #   states_count[states.index(state_names)] += 1
            #except ValueError:
            #   states.append(state_names)
            #  states_count.append(1)

            if len(new_communities) > 1:
                # match communities
                confusion = create_confusion_matrix(new_communities[-2], new_communities[-1])
                create_continuation_matrix(confusion, sigma, jaccard_null_model)
                #   [clean_old.set.set_ground_truth(event='reset') for clean_old in new_communities[-2]]
                match_communities(new_communities[-2], new_communities[-1],
                                dead_communities, confusion)

                state_transition = State(list(confusion[:-1, :-1].sum(axis=1)), list(confusion[:-1, :-1].sum(axis=0)), vi)
                state = np.reshape(confusion[:-1, :-1],  state_transition.edges_len)
                state_transition.set_state(state)
                score = state_transition.similarity

                # find rebirths
                # for dead in dead_communities:
                candidate_communities = [communities for communities in new_communities[-1]
                                        if communities.community_events[-1][1] != "P"]
                if candidate_communities:
                    dead_confusion = create_confusion_matrix(dead_communities, candidate_communities)
                    save_jaccard_index_matrix = Community.jaccard_index.copy()
                    save_continuation_matrix = Community.continuation.copy()
                    create_continuation_matrix(dead_confusion, sigma, jaccard_null_model)
                    set_dead_communities = dead_communities.copy()
                    find_rebirths(set_dead_communities, candidate_communities, dead_communities)
                    Community.jaccard_index = save_jaccard_index_matrix
                    Community.continuation = save_continuation_matrix

                #print(score,new_communities[-2], new_communities[-1])
                
                return_evolution_taxonomy.append(new_communities[-1])
                return_evolution_taxonomy.append(new_communities[-2])
                
        return return_evolution_taxonomy
    
    def conversion_to_alluvial(self,et):
        
        evolution_dict = {'N': 'Begin',
                'R': 'Regenerate',
                'G': 'Grow',
                'C': 'Contract',
                'P': 'Preserve',
                'O': 'Replace',
                'S': 'Split',
                'M': 'Merge',
                'F': 'Vanish',
                'A': 'Absorb',
                'B': 'Resurge'}

        type_dict = {'S': 'start',          # current state
                    'E': 'end',            # what happened at the end of the transition
                    'T': 'to',
                    'F': 'from'}

        dict_alluvial = {}
        for att in et:
            for a in att:
                e = a.get_ground_truth()
                n = a.get_community_name()
                total = a.get_number_total_nodes()
                for ee in e:
                    if type_dict[ee[0]] is not 'end' and  type_dict[ee[0]] is not 'start': #ignore from (ressurges, for example) e to
                       continue
                    if evolution_dict[ee[1]] is '':
                        continue
                    
                    source = n
                    size_source = total
                    if ee[3] is not None:
                        target = ee[3][0].get_community_name()
                        size_target = ee[3][0].get_number_total_nodes()
                    else:
                        target = None
                        size_target = -1

                    timestamp = ee[2]
                    event = evolution_dict[ee[1]]
                    when = type_dict[ee[0]]
                    
                    if timestamp not in dict_alluvial:
                        #tuple(source,target,event,when,size_source,size_target)
                        dict_alluvial[timestamp] = [(source,target,event,when,size_source,size_target)]
                    elif (source,target,event,when,size_source,size_target) not in dict_alluvial[timestamp]:
                        dict_alluvial[timestamp].append((source,target,event,when,size_source,size_target))
                    
                    
        return dict(sorted(dict_alluvial.items()))

    def convert_community_per_time_to_evolution_taxonomy(self,resultAlluvial):
        
        return 0
