var testData = {
  lines: [{
    id: 'line1',
    name: '1号线',
    color: '#e999c0',
    width: 2,
    running: false,
    points: [
      [{
        x: 10,
        y: 20
      }, {
        x: 50,
        y: 20
      }, {
        x: 120,
        y: 20
      }, {
        x: 160,
        y: 75
      }]
    ]
  }, {
    id: 'line2',
    name: '2号线',
    color: '#8cc220',
    width: 2,
    running: false,
    points: [
      [{
        x: 10,
        y: 20
      }, {
        x: 50,
        y: 40
      }, {
        x: 90,
        y: 20
      }, {
        x: 200,
        y: 20
      }]
    ]
  }],
  stations: [
    //1号线
    {
      id: 'station1',
      name: '金运路',
      type: 1,
      x: 0,
      y: 0,
      status: 'normal',
      rotation: 0
    }, {
      id: 'station2',
      name: '金沙江西路',
      type: 1,
      x: 30,
      y: 0,
      status: 'normal',
      rotation: 0
    }, {
      id: 'station3',
      name: '金沙江西路',
      type: 1,
      x: 30,
      y: 30,
      status: 'normal',
      rotation: 0
    }, {
      id: 'station4',
      name: '金沙江西路',
      type: 1,
      x: 60,
      y: 0,
      status: 'normal',
      rotation: 0
    }, {
      id: 'station5',
      name: '金沙江西路',
      type: 1,
      x: 90,
      y: 0,
      status: 'normal',
      rotation: 0
    }
  ]
}
