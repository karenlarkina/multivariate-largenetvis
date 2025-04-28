from platform import node
from flask import Flask, make_response, render_template, request, redirect, flash
from werkzeug.utils import secure_filename
import pandas as pd

import os
import shutil
import json
from model import Model
from graph import Graph

UPLOAD_FOLDER = '../uploaded_networks'
ALLOWED_EXTENSIONS = {'txt', 'dat'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = "key key key"

networkFolder = ''
networkfilename = ''
nodeMetadatafilename = ''

omodel = None

#VIEWS
################################################################

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/getTaxonomy', methods=['POST'])
def getTaxonomy():
    json_req = request.get_json()
    numberTimeslices = json_req['numberTimeslices']
    samplingMethod = json_req['samplingMethod']
    percentageSampling = json_req['percentageSampling']
    minimumCommunitySize = json_req['ignoreCommunitiesLSmallerThan']
    sigma = json_req['sigma']

    global omodel
    #if omodel is None: # and networkFolder != '' and networkfilename != '': #nodeMetadatafilename can be empty
    #print("None met1")
    #print(networkfilename)
    nodeMetadatafilename = request.args.get('metadata_file')
    edge_attribute = request.args.get('edge_attribute')
    omodel = Model(networkFolder, networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename, numberTimeslices, edge_attribute, samplingMethod, percentageSampling, minimumCommunitySize, sigma)

    return omodel.getTaxonomy()

@app.route('/getCommunitiesEvolution', methods=['POST'])
def getCommunitiesEvolution():
    #global omodel
    #if omodel is None: # and networkFolder != '' and networkfilename != '':
    #    print("None met2")
    #    omodel = Model(networkFolder, networkfilename, nodeMetadatafilename)

    a, b = omodel.getCommunitiesEvolution()
        
    return a

@app.route('/getCommunitiesEvolutionTeste', methods=['POST'])
def getCommunitiesEvolutionTeste():
    #global omodel
    #if omodel is None: # and networkFolder != '' and networkfilename != '':
    #    print("None met2")
    #    omodel = Model(networkFolder, networkfilename, nodeMetadatafilename)

        
    return omodel.getCommunitiesEvolutionTeste()

@app.route('/getNodeMetadata', methods=['POST'])
def getNodeMetadata():
    global omodel
    if omodel is None:
        print("None node met3")
    return omodel.getNodeMetadata()

@app.route('/getGraphEdgeLabels', methods=['POST'])
def getEdgeMetadata():
    global omodel
    if omodel is None:
        print("None edge met3")
    return omodel.getGraphEdgeLabels()

@app.route('/getCandidateNumberTimeslices', methods=['POST'])
def getCandidateNumberTimeslices():
    return omodel.getCandidateNumberTimeslices()

@app.route('/getGraphInfo', methods=['POST'])
def getGraphInfo():
    return omodel.getGraphInfo()

@app.route('/getNodeInfo', methods=['POST'])
def getNodeInfo():
    return omodel.getNodeInfo()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():

    global networkfilename
    networkfilename = request.form.get('network_radio_button')

    global nodeExtraMetadataFilename
    nodeExtraMetadataFilename = ''
    
    global nodeMetadatafilename
    nodeMetadatafilename = ''

    if  networkfilename == '1_primarySchool_firstDay': 
        networkfilename = '1_primarySchool_firstDay_v2'
        nodeMetadatafilename = '2_primarySchool_firstDay_nodeLabels'
        nodeExtraMetadataFilename = '3_primarySchool_firstDay_nodeLabels'
    elif  networkfilename == '1_sbsi': 
        nodeMetadatafilename = '2_sbsi_nodeLabels'
        nodeExtraMetadataFilename = '3_sbsi_nodeExtraMetadata'
    elif  networkfilename == '1_highSchool': 
        nodeMetadatafilename = '2_highSchool_nodeLabels'
        nodeExtraMetadataFilename = ''
    elif  networkfilename == '1_hospital': 
        nodeMetadatafilename = '2_hospital_nodeLabels'
        nodeExtraMetadataFilename = ''
    elif  networkfilename == '1_InVS': 
        nodeMetadatafilename = '2_InVS_nodeLabels'
        nodeExtraMetadataFilename = ''
    elif  networkfilename == '1_twitter': 
        nodeMetadatafilename = '2_twitter_nodeLabels'
     
    ######## For pre-defined networks ########
    
    global omodel
    omodel = None #reset in case user is opening new network

    graph = Graph('', networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename, '')
    graphInfo = graph.getGraphInfo()

    return json.dumps([{'type': 'success', 'message': 'File(s) uploaded.', 'graphInfo': graphInfo}])

    ############## The below part is necessary so the user can submit any network. During development, we are going to allow only networks chosen through menu radio buttons.
    
    # if not os.path.isdir(app.config['UPLOAD_FOLDER']):
    #         os.mkdir(app.config['UPLOAD_FOLDER'])
    
    # if request.method == 'POST':
    #     # check if the post request has the file part
    #     if 'networkfile' not in request.files:
    #         return json.dumps([{'type': 'danger', 'message': 'No file part.'}]) #options for the 1st parameter include primary, secondary, success, danger, warning, info, light, dark (https://getbootstrap.com/docs/5.0/components/alerts/)
        
    #     networkfile = request.files['networkfile']
    #     nodeMetadatafile = request.files['metadatafile']
    #     extra_nodeMetadatafile = request.files['extra_metadatafile']


    #     # If the user does not select a file, the browser submits an
    #     # empty file without a filename.
    #     if networkfile.filename == '':
    #         print('No selected file')
    #         return json.dumps([{'type': 'danger', 'message': 'Network file not selected. Try again.'}])
    #     if networkfile:
    #         networkNameFile = secure_filename(networkfile.filename.rsplit('.', 1)[0].lower())
    #         if not allowed_file(networkfile.filename):
    #             return json.dumps([{'type': 'danger', 'message': 'File extension not accepted.'}])

    #     try:
    #         global networkFolder
    #         networkFolder = app.config['UPLOAD_FOLDER'] + "/" + networkNameFile
    #         if os.path.isdir(networkFolder):
    #             shutil.rmtree(networkFolder)
    #         os.mkdir(networkFolder)
    #     except OSError:
    #         return json.dumps([{'type': 'danger', 'message': 'Creation or deletion of the network directory failed.'}])
    #     else:
    #         print ("Successfully created the directory %s " % networkFolder)
    #         #global networkfilename
    #         networkfilename = secure_filename(networkfile.filename)
    #         networkfile.save(os.path.join(networkFolder, networkfilename))

    #         if nodeMetadatafile != None and nodeMetadatafile.filename != '':
    #             #global nodeMetadatafilename
    #             nodeMetadataFileExtension = nodeMetadatafile.filename.rsplit('.', 1)[1].lower()
    #             nodeMetadatafilename = secure_filename(networkNameFile + "_nodeMetadata." + nodeMetadataFileExtension)
    #             nodeMetadatafile.save(os.path.join(networkFolder, nodeMetadatafilename))
    #             nodeMetadatafilename = secure_filename(networkNameFile + "_nodeMetadata")


    #         if extra_nodeMetadatafile != None and extra_nodeMetadatafile.filename != '':
    #             #global nodeMetadatafilename
    #             extra_nodeMetadataFileExtension = extra_nodeMetadatafile.filename.rsplit('.', 1)[1].lower()
    #             nodeExtraMetadataFilename = secure_filename(networkNameFile + "_extra_nodeMetadata." + extra_nodeMetadataFileExtension)
    #             extra_nodeMetadatafile.save(os.path.join(networkFolder, nodeExtraMetadataFilename))
    #             nodeExtraMetadataFilename = secure_filename(networkNameFile + "_extra_nodeMetadata")


    #         #global omodel
    #         omodel = None #reset in case user is opening new network

    #         networkfilename = secure_filename(networkfile.filename.rsplit('.', 1)[0].lower())
            
    #         graph = Graph(networkFolder, networkfilename, nodeMetadatafilename, nodeExtraMetadataFilename)

    #         graphInfo = graph.getGraphInfo()

    #         return json.dumps([{'type': 'success', 'message': 'File(s) uploaded.', 'graphInfo': graphInfo}])
        
    # return ''

if __name__ == '__main__':
    app.run(debug=True, host='localhost')