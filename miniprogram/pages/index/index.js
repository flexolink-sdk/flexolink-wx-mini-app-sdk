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
      '开始记录',
      '查询离线数据',
      '合并离线数据',
      '取消离线数据合并',
      '擦除离线数据',
    ],
    protocolModel: {},///数据类型：{eeg:"", accel:"", gyro:"", battery:-1, isWear:false, hex:""}
    deviceModel: {},///数据类型：{deviceName: device.name, isConnected:false, mac:"", deviceId:device.deviceId, serviceId:"", readCharacteristicId:"", writeCharacteristicId:"", flexModel:flexModel}
    deviceList:[],//设备列表，上面的 model 类型的数组
    realData: '',///接收实时数据
    savedUid: '',
    savedEdfName: '',
    savedUser: '',
    offlineUid: ''/// 需要从插件中查询离线数据，如果返回 '00000000' 代表无离线数据，返回其他代表有离线数据

  },

  onLoad() {
    // 授权，请填写真实的 appKey, appSecret
    plugin.auth('appKey', 'appSecret', function(status, res){
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
      case 0:///扫描脑贴设备
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

    case 11:///开始采集数据
      ///脑贴里有离线数据，可以引导用户同步数据，否则开始采集则会擦除离线数据
      if (this.hasConnected()) {
        const hasOfflineData = this.hasOfflineData()
        if (hasOfflineData == -1) {
          wx.showToast({
            title: '请先查询离线数据',
          })
          return
        }
        if (hasOfflineData == 1) {
          wx.showModal({
            title: '脑贴里存在离线数据，请先同步数据',
            content: '',
          })
          return
        }
        plugin.onStartRecord()
      }
      break;

    case 12:///查询离线数据
      if (this.hasConnected()) {
        const uid = plugin.onQueryOfflineData()
        this.data.offlineUid = uid;
        wx.showToast({
          title: 'uid='+uid,
        })
      }
      break;

    case 13:///合并离线数据
      if (this.hasConnected()) {
        const hasOfflineData = this.hasOfflineData()
        if (hasOfflineData != 1) {
          wx.showToast({
            title: '脑贴没有离线数据',
          })
          return
        }
        //code
        // const MergeStartStatus = 1000
        // const MergeCancelStatus = 1001
        // const MergeFinishStatus = 1002
        // const MergeFinishZipUrlStatus = 1003   没有对应的 desc，因为会返回真实的 zip url
        // const MergeReceiveStatus = 1004
        // const MergeUploadDecompressStatus = 1005
        // const MergeDecodeStatus = 1006
        // const MergeUploadZipStatus = 1007
        //desc
        // const MergeStartDesc = '开始合并'
        // const MergeCancelDesc = '用户取消合并'
        // const MergeFinishDesc = '合并完成'
        // const MergeReceiveDesc = '接收离线数据中'
        // const MergeUploadDecompressDesc = '上传待解压数据'
        // const MergeDecodeDesc = '数据转码中'
        // const MergeUploadZipDesc = '上传压缩文件中'
        plugin.mergeOfflineData((code, desc, progress)=>{
          that.setData({
            realData: desc + ',进度:'+progress,
          })
        })
      }
      break;

    case 14:///取消合并离线数据
      if (this.hasConnected()) {
        ///取消合并数据，下次合并会从头开始
        plugin.onCancelOfflineData()
      }
      break;

    case 15:///擦除离线数据
      if (this.hasConnected()) {
        const hasOfflineData = this.hasOfflineData()
        if (hasOfflineData == -1) {
          wx.showToast({
            title: '请先查询离线数据',
          })
          return
        }
        if (hasOfflineData != 1) {
          wx.showToast({
            title: '脑贴没有离线数据',
          })
          return
        }
        wx.showModal({
          title: '擦除离线数据后不可恢复，请确认是否擦除',
          content: '',
          success: (res) => {
            if (res.confirm) {
              this.data.offlineUid = '00000000'
              plugin.onClearOfflineData()
            } else if (res.cancel) {
            }
          }
        })
      }
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
  },

  ///是否存在离线数据
  hasOfflineData:function() {
    ///请先查询离线数据
    if (this.data.offlineUid == '') {
      wx.showToast({
        title: '请先查询离线数据',
      })
      return -1;
    }
    ///没有离线数据
    if (this.data.offlineUid == '00000000') {
      return 0;
    }
    ///有离线数据
    return 1;
  }

})
