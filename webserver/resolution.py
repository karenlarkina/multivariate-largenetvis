import numpy as np
import time as time_lib

import math
import statistics

import pandas as pd


class Resolution:

    def applyUniformResolution(self, df_originalRes, newResolution):
        'Ponciano, Jean R., et al. "An online and nonuniform timeslicing method for network visualisation." Computers & Graphics 97 (2021): 170-182.'
        'Linhares, Claudio DG et al. DyNetVis: a system for visualization of dynamic networks. In: Proceedings of the Symposium on Applied Computing. 2017. p. 187-194.'


        df = df_originalRes.copy()
        
        minTime = df["t"].min()
        
        df['t_res'] = (((df['t'] - minTime) / newResolution).apply(np.floor)).astype(int) + minTime
        df.drop('t', axis=1, inplace=True)
        df.drop_duplicates(subset=['node_id1', 'node_id2', 't_res'], inplace=True)
        df = df.reset_index(drop=True)
        df = df.rename(columns={'t_res': 't'})
        return df



    def fadingSum(self, windowEdgeCounts, numberTimesWithEdges, fadingFactor):
        if len(windowEdgeCounts) == 1:
            return windowEdgeCounts[0] / numberTimesWithEdges

        edgeCountThisTime = windowEdgeCounts[0]
        windowEdgeCounts.pop(0)
        
        return (edgeCountThisTime/numberTimesWithEdges) + fadingFactor * self.fadingSum(windowEdgeCounts, numberTimesWithEdges, fadingFactor)
        


    def computeAdaptiveResolution(self, df_originalRes, fadingFactor,  useAVG_idleWindow = True, windowSize = 100, current_res_importance = 0.2):
        'Ponciano, Jean R., et al. "An online and nonuniform timeslicing method for network visualisation." Computers & Graphics 97 (2021): 170-182.'


        'This method computes adaptive resolution but does not apply it on the edges'
        
        'df_originalRes stands for the original network (pandas dataframe)'
        
        'fadingFactor (0 << fadingFactor <= 1) is a constant such that the higher its value, the more importance is given to old elements.'
        
        'windowSize is the size of the window (integer)'
        'windowSize = 100 is based on the mentioned paper.'
        
        'useAVG_idleWindow <true> ==> if new_res = 0 , then new_res is set as the average value of all past resolutions, '
        'so large inactivity periods (i.e. without edges) may be represented by a resolution scale different '
        'from the original. With this decision, our method reduces not only the number of timestamps devoted '
        'to intervals with high density, but also the idle ones.'

        'current_res_importance (0 <= current_res_importance <= 1) is a constant that determines the importance of the current resolution value in the computation of the new one.'
        'current_res_importance = 0.2 is based on the mentioned paper.'
        
        windowEdgeCounts = []
        
        minTime = df_originalRes["t"].min()
        maxTime = df_originalRes["t"].max()
        
        #current_res_importance = 0.2 # (0 <= current_res_importance <= 1) is a constant that determines the importance of the current resolution value in the computation of the new one.
        current_res = 1 #cold start

        resolutionsPerWindow = []
        
        for t in range(minTime,maxTime+1):
            
            df_thisTime = df_originalRes.loc[df_originalRes['t'] == t]
            windowEdgeCounts.append(len(df_thisTime.index)) #number of edges in this time
                    
            if t % windowSize == 0 and t != 0:
                
                #compute new resolution
                numberTimesWithEdges = sum(1 for i in windowEdgeCounts if i != 0)
                if numberTimesWithEdges == 0:
                    new_res = 0
                else:
                    new_res = math.floor(current_res_importance* current_res + (1 - current_res_importance) * self.fadingSum(windowEdgeCounts, numberTimesWithEdges, fadingFactor))

                    
                if new_res == 0:
                    if useAVG_idleWindow and len(resolutionsPerWindow) != 0:
                        new_res = math.floor(statistics.mean(resolutionsPerWindow))
    
                    if new_res == 0: #if it is still zero
                        new_res = 1
                elif new_res > windowSize: #a single timestamp cannot comprehend an interval higher than windowSize
                    new_res = windowSize

                if numberTimesWithEdges != 0:        
                    resolutionsPerWindow.append(new_res)
                    
                current_res = new_res
                if t+windowSize < maxTime:
                    end = t+windowSize
                else:
                    end = maxTime
                #print(repr(new_res) + ' to be used on window [' + repr(t) + ', ' + repr(end) + ']')
                windowEdgeCounts = []
                
        
        #print("Avg resolution: " + repr(math.floor(statistics.mean(resolutionsPerWindow))))
        #print("Median resolution: " + repr(math.floor(statistics.median(resolutionsPerWindow))))
        #print("Mode resolution: " + repr(math.floor(statistics.mode(resolutionsPerWindow))))

        output = {}
        output['fadingFactor'] = fadingFactor
        output['avgResolution'] = math.floor(statistics.mean(resolutionsPerWindow))
        output['medianResolution'] = math.floor(statistics.median(resolutionsPerWindow))
        output['minResolution'] = min(resolutionsPerWindow)
        output['maxResolution'] = max(resolutionsPerWindow)

        return output


    def computeNumberTimeslicesFromResolutions(self, resolutionsInfo, numberTimestampsInTheNetwork, approach):
        'Given a dict resolutionsInfo with a set of resolutions, return the number of timestamps required by each resolution.'
        
        'Approach 1: number of timeslices = number times in the network / resolution value.' 
        'Approach 2: number of timeslices = resolution value itself.'


        output = {}

        if approach == 1:

            for key in resolutionsInfo:
                if 'Resolution' in key: #ignore 'fadingFactor' key
                    output['using_' + key] = math.floor(numberTimestampsInTheNetwork / resolutionsInfo[key])

        
        elif approach == 2:
            for key in resolutionsInfo:
                if 'Resolution' in key: #ignore 'fadingFactor' key
                    output['using_' + key] = resolutionsInfo[key]


        return output

