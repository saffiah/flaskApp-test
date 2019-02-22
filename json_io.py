#!flask/bin/python

import sys
import io
import ezdxf
from ezdxf.r12writer import r12writer
from flask import Flask, render_template, request, redirect, Response, jsonify
from flask_sqlalchemy import SQLAlchemy
import random, json


app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////test.db'
db = SQLAlchemy(app)

#create class to represent a table in database to hold the files
class FileContents(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(300))
    data = db.Column(db.LargeBinary)

@app.route('/')
def output():
	# serve index template
	return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['inputFile']

    newFile = FileContents(name=file.filename, data=file.read())
    db.session.add(newFile)
    db.session.commit()

    return 'Saved ' +file.filename + ' to the database!'

@app.route('/receiver', methods = ['POST'])
def worker():
	# read json + reply
    print 'hi.....inside Python'
    data = request.get_json(force=True)
    result = ''
    print type(data)
    result = json.dumps(data)
    #print result
    result = json.loads(result)
    print type(result)
    #check whether the feature data is a linestring or point type

    numFeats = len(result['features'])
    if (numFeats > 0):
        geometryType = result['features'][0]['geometry']['type']
        print geometryType, type(geometryType)
        #if type is linestring, run the linestring code;
        if (str(geometryType) == 'LineString'):
            print "hello"
            AttribInfo = result['features'][0]['properties']
            Attribs = AttribInfo.keys()
            #print AttribInfo

            #line information/coordinates only, copied from writeLinestring.py
            with r12writer("write_Lines.dxf") as dxf:
                #where is this file being written?
                for i in range(numFeats):
                    a_linefeature = result['features'][i]['geometry']['coordinates']
                    dxf.add_polyline(a_linefeature)
                    strDict = result['features'][i]['properties']
                    strDict = json.dumps(strDict)
                    strDict = strDict.encode('ascii','replace')
                    dxf.add_text(strDict[1:-1],insert=(a_linefeature[0][0],a_linefeature[0][1]))
            #dwg = ezdxf.readfile('write_Lines.dxf')
            dwg = io.open('write_Lines.dxf',mode='rt')
            outputText = dwg.read()

        elif (str(geometryType) == 'Point'):
            #copied from writeDXF_StrInput.py
            dwg = ezdxf.new('R2010')
            flag = dwg.blocks.new(name='FLAG')
            msp = dwg.modelspace()
            flag.add_point((0, 0),dxfattribs={'color': 2})
            AttribInfo = result['features'][0]['properties']
            Attribs = AttribInfo.keys()

            #add attribute definitions
            x = 0.5
            y = -1
            for i in Attribs:
                property = i;
                flag.add_attdef(str(property), (x, y), {'height': 0.5, 'color': 3})
                y = y-1.5

            # Now I can populate the drawing object and create the dxf file
                # get each coordinate
                # get the attribute information and store with each point
            points = []
            x = 0.5
            for i in range(numFeats):
                a_point = result['features'][i]['geometry']['coordinates']
                att_info_dict = result['features'][i]['properties']
                points.append(a_point) #a list of lists, each coordinate is of type float
                msp.add_auto_blockref('FLAG',a_point,att_info_dict)

            dwg.saveas('write_point_att1.dxf')
            dwgT = io.open('write_point_att1.dxf',mode='rt')
            outputText = dwgT.read()
    else:
        outputText = ''

    output = outputText

    return output

if __name__ == '__main__':
    # run!
    app.run(debug=True)
