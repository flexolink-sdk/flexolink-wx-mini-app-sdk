const plugin = requirePlugin('flect-plugin')

Page({
  data: {
    items: [
      '扫描设备',
      '停止扫描',
      '关闭设备连接',
      '实时数据监听',
      '实时滤波数据监听',
      '是否佩戴额贴',
      '获取连接状态',
      '原始数据截取',
      '获取设备电量',
      '信号强度',
      '设置滤波参数(阶数2，高通50，低通15)',
      // '查看波形'
    ],
    protocolModel: {},///数据类型：{eeg:"", accel:"", gyro:"", battery:-1, isWear:false, hex:""}
    deviceModel: {},///数据类型：{deviceName: device.name, isConnected:false, mac:"", deviceId:device.deviceId, serviceId:"", readCharacteristicId:"", writeCharacteristicId:"", flexModel:flexModel}
    deviceList:[],//设备列表，上面的 model 类型的数组
    realData: '',///接收实时数据

  },

  onLoad() {
    // 授权，请填写真实的 appKey, appSecret
    plugin.auth('appKey', 'appSecret', function(status, res){
      console.log(res)
    })

    plugin.isShowToast = true
  },

  changeConnectState:function(device) {
    var bleModel = device.currentTarget.dataset.name;
    const that = this

    if (!bleModel.isConnected) {
      ///暂时限定只能连接一个
      if (this.data.deviceModel.isConnected) {
        wx.showToast({
          title: '请先断开其他设备连接',
        })
        return;
      }

      plugin.onConnectDevice(bleModel, function(res) {
        var list = that.data.deviceList;
        for (var i = 0; i < list.length; i ++) {
          var device = list[i];
          if (device.deviceName == res.deviceName) {
            list[i] = res
            break
          }
        }

        that.setData({
          deviceList: list,
          deviceModel: res
        })
      })

    } else {
      plugin.onDisconnectDevice(bleModel, function(res) {
        var list = that.data.deviceList;
        for (var i = 0; i < list.length; i ++) {
          var device = list[i];
          if (device.deviceName == res.deviceName) {
            device = res
            break
          }
        }

        that.setData({
          deviceList: list,
          deviceModel: res
        })
      })
    }
  },
  /// wxml 上的点击事件
  onClick:function(param) {
    var index = param.currentTarget.dataset.name;
    const that = this

    switch(index) {
      case 0:///扫描设备
        plugin.onScanDevice(function (res) { 
          var list = that.data.deviceList;
          for (var i = 0; i < res.length; i ++) {
            list.push(res[i]);
          }
          that.setData({
            deviceList: list
          })
        })
        break;

      case 1:///停止扫描
        plugin.onStopScanDevice()
        break;
        
      case 2:///断开连接
        if (this.hasConnected()) {
          const that = this
          plugin.onDisconnectDevice(this.data.deviceModel, function(res) {
            var list = that.data.deviceList;
            for (var i = 0; i < list.length; i ++) {
              var device = list[i]
              if (device.deviceName == res.deviceName) {
                device = res
                break
              }
            }

            that.setData({
              deviceList: list,
              deviceModel: res
            })
          })
        }
        break;

      case 3:///打开实时数据
        if (this.hasConnected()) {
          plugin.openRealData(this.data.deviceModel, true, (realData) => {
            this.setData({
              realData: realData
            })
          })
        }
        break;

      case 4:///打开实时滤波数据
        if (this.hasConnected()) {
          plugin.openFilterRealData(this.data.deviceModel, true, (realData) => {
            this.setData({
              realData: realData
            })
          })
        }
        break;

      case 5:///是否佩戴
        if (this.hasConnected()) {
          plugin.isWear(this.data.deviceModel);
        }
        break;

      case 6:///是否连接
        plugin.isConnected(this.data.deviceModel);
        break;

      case 7:///截取数据
        if (this.hasConnected()) {
          let pickData = plugin.startPickupData();
          wx.showToast({
            title: pickData.join(),
          })
        }
        break;

      case 8:///设备电量
        if(this.hasConnected()) {
          plugin.getBattery(this.data.deviceModel);
        }
        break;

      case 9:///信号强度
        if(this.hasConnected()) {
          ///调用 wx.getBLEDeviceRSSI,异步获取后会将设备信号强度写入 deviceModel
          plugin.getDeviceRRSI(this.data.deviceModel);
        }
        break;

      case 10:///滤波参数
        if (this.hasConnected()) {
          plugin.filterParam(2, 50, 15)
        }
        break;

      case 11:///查看波形暂未实现
        wx.navigateTo({
          url:"wave",
          events:{

          },
          success:function(res) {
            res.eventChannel.emit('acceptDataFromOpenerPage', { data: realData })
          },
        });
        break;
    }
  },

  ///设备是否连接
  hasConnected:function() {
    if (!this.data.deviceModel.isConnected) {
      wx.showToast({
        title: '请先连接设备',
      })
      return false;
    }
    return true;
  }
})
