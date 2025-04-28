# -*- coding: utf-8 -*-
"""
Created on Tue Jun  7 11:21:25 2016

@author: Bijaya Adhikari
"""

import sys
import time
import subprocess

from merge import netCondenseRoutine



if len(sys.argv)!=5:
    print('Check usage')
    
pathToFile = sys.argv[1]
alphaN = sys.argv[2]
alphaT = sys.argv[3]
matlab_path=sys.argv[4]
t1=time.time()


scoringFunction="getScores('"+pathToFile+"')"
subprocess.call([matlab_path,"-nosplash","-nojvm","-r", scoringFunction])

netCondenseRoutine(pathToFile, float(alphaN), float(alphaT), pathToFile+'_edgeScores', pathToFile+'_timeScores')

t2 = time.time()

print(t2-t1)



    

