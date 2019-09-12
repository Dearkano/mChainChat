import React, {Component} from 'react';
import {StyleSheet, View, Text, Linking} from 'react-native';
import {Bubble, GiftedChat, SystemMessage} from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-community/async-storage';
import AccessoryBar from './AccessoryBar';
import CustomActions from './CustomActions';
// import CustomView from './CustomView'
import NavBar from './NavBar';
import messagesData from './data/messages';
import earlierMessages from './data/earlierMessages';
import io from 'socket.io-client';
import JsEncrypt from 'jsencrypt';
import {withNavigation} from 'react-navigation';
import bs58 from 'bs58';
import g from '../../state';
import {Generate_key} from '../../utils';
import {Provider, Modal, InputItem} from '@ant-design/react-native';
const config = require('../../config.json')
const CryptoJS = require('crypto-js');

const styles = StyleSheet.create({
  container: {flex: 1},
});
const convertFile = async file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
  });
};

//const host = '139.159.244.231:8085';
//const host1 = 'http://10.6.71.79:8080';
const host1 = config.bos;
// const receiver = 'FuKTBcX8jUcQxg2FntSwx89GRmeXNCw5o6BjYmmEjWoV';
class App extends Component {
  state = {
    step: 0,
    messages: [],
    loadEarlier: true,
    typingText: null,
    isLoadingEarlier: false,
    ws: null,
    receiverPublicKey: '',
    userInfo: null,
    AESKEY: '',
    encryptedAESKEY: '',
    visible: false,
    remark: this.props.navigation.getParam('remark'),
  };

  _isMounted = false;

  async componentDidMount() {
    const host = g.state.host;
    const receiver = this.props.navigation.getParam('receiver');
    // get userInfo
    const value = await AsyncStorage.getItem('userInfo');
    const userInfo = JSON.parse(value);
    const {token, addr, publicKey, privateKey} = userInfo;
    const wshost = `ws://${host}`;
    const query = `?sender=${encodeURIComponent(
      addr,
    )}&receiver=${encodeURIComponent(receiver)}`;
    console.log(wshost + query);
    // get receiver's publicKey
    const res1 = await fetch(
      `http://${host}/getPublicKey?username=${encodeURIComponent(receiver)}`,
    );
    if (res1.status !== 200) return;
    const data1 = await res1.json();
    console.log(data1);
    const pkAfid = data1.publicKey;
    const resp = await fetch(
      `${host1}/msg/download?token=${token}&afid=${pkAfid}`,
    );
    const d = await resp.json();
    console.log(d);
    const receiverPublicKey = d.Message;

    // set aes key
    let AESKEY = '';
    const tag = `${addr}-${receiver}`;
    let res = await fetch(
      `${host1}/afid/getbytag?token=${token}&tag=ChainChat::AESKEY-${tag}`,
    );
    let data = await res.json();
    if (data.SuccStatus <= 0) return;
    // if the AES Key not exists
    if (!data.Afids || data.Afids.length === 0) {
      AESKEY = Generate_key();
      const encrypt = new JsEncrypt();
      encrypt.setPublicKey(publicKey);
      const encryptedContent = encrypt.encrypt(AESKEY);
      let body = new FormData();
      body.append('token', token);
      body.append('message', encryptedContent);
      res = await fetch(`${host1}/msg/upload`, {
        method: 'post',
        body,
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      const AESKEYAfid = data.Afid;
      body = new FormData();
      body.append('token', token);
      body.append('afid', AESKEYAfid);
      res = await fetch(`${host1}/afid/add`, {
        method: 'post',
        body,
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      // add tag
      body = new FormData();
      body.append('token', token);
      body.append('tag', `ChainChat::AESKEY-${tag}`);
      body.append('afid', AESKEYAfid);
      res = await fetch(`${host1}/afid/addtag`, {
        method: 'post',
        body,
      });
      data = await res.json();
      if (data.SuccStatus <= 0) return;
    } else {
      const afid = data.Afids[0].Afid;
      res = await fetch(`${host1}/msg/download?afid=${afid}&token=${token}`);
      data = await res.json();
      if (data.SuccStatus <= 0) return;
      let encrypt = new JsEncrypt();
      encrypt.setPrivateKey(privateKey);
      AESKEY = encrypt.decrypt(data.Message);
    }

    const encrypt = new JsEncrypt();
    encrypt.setPublicKey(receiverPublicKey);
    const encryptedAESKEY = encrypt.encrypt(AESKEY);
    this.setState({receiverPublicKey, AESKEY, encryptedAESKEY});
    const ws = io(wshost + query);
    const that = this;
    ws.on('connect', async function() {
      console.log('on connection');
      that.setState({ws});
    });
    ws.on('historytest', str => console.log('history test' + str));
    ws.on('history', async str => {
      console.log(that.state.messages);
      if (that.state.messages.length !== 1) return;
      console.log('history');
      const data = JSON.parse(str);
      console.log(data);
      let newMessages = [];
      for (const item of data) {
        if (item.type === 'afid') {
          const res = await fetch(
            `${host1}/msg/download?token=${token}&afid=${item.afid}`,
          );
          const d = await res.json();
          const obj = JSON.parse(d.Message);
          let encrypt = new JsEncrypt();
          encrypt.setPrivateKey(privateKey);
          const ph = encrypt.decrypt(obj.ph) || this.state.AESKEY;
          console.log(item);
          const createdAt = new Date(parseInt(item.timestamp));
          const mes = CryptoJS.AES.decrypt(obj.cipher, ph).toString(
            CryptoJS.enc.Utf8,
          );
          const receiverId =
            item.sender === addr
              ? Number('0x' + bs58.decode(addr).toString('hex'))
              : Number('0x' + bs58.decode(receiver).toString('hex'));
          const name = item.sender === addr ? addr : receiver;

          newMessages = [
            {
              text: mes,
              createdAt,
              user: {
                _id: receiverId,
                name,
                avatar: 'https://placeimg.com/140/140/any',
              },
              _id: Math.round(Math.random() * 1000000),
            },
          ];
        } else if (item.type === 'image') {
          const res = await fetch(
            `${host1}/file/download?token=${token}&afid=${item.afid}`,
          );
          const data = await res.blob();
          const base64 = await convertFile(data);
          console.log(base64);
          const receiverId =
            item.sender === addr
              ? Number('0x' + bs58.decode(addr).toString('hex'))
              : Number('0x' + bs58.decode(receiver).toString('hex'));
          const name = item.sender === addr ? addr : receiver;
          newMessages = [
            {
              image: base64,
              createdAt: new Date(parseInt(item.timestamp)),
              user: {
                _id: receiverId,
                name,
                avatar: 'https://placeimg.com/140/140/any',
              },
              _id: Math.round(Math.random() * 1000000),
            },
          ];
        }
        this.setState({
          messages: this.state.messages.concat(newMessages),
          loadEarlier: false,
          isLoadingEarlier: false,
        });
      }
    });

    ws.on('res', async str => {
      console.log(str);
      const data = JSON.parse(str);
      const afid = data.data;
      const type = data.type;
      let newMessages = [];
      if (type === 'afid') {
        const res = await fetch(
          `${host1}/msg/download?token=${token}&afid=${afid}`,
        );
        const d = await res.json();
        const isSuccess = d.SuccStatus > 0;
        if (!isSuccess) return;
        const obj = JSON.parse(d.Message);
        let encrypt = new JsEncrypt();
        encrypt.setPrivateKey(privateKey);
        const ph = encrypt.decrypt(obj.ph);
        const mes = CryptoJS.AES.decrypt(obj.cipher, ph).toString(
          CryptoJS.enc.Utf8,
        );
        const receiverId = Number('0x' + bs58.decode(receiver).toString('hex'));
        const name = receiver;
        newMessages = [
          {
            text: mes,
            createdAt: new Date(),
            user: {
              _id: receiverId,
              name,
              avatar: 'https://placeimg.com/140/140/any',
            },
            _id: Math.round(Math.random() * 1000000),
          },
        ];
      } else if (type === 'image') {
        const res = await fetch(
          `${host1}/file/download?token=${token}&afid=${afid}`,
        );
        const data = await res.blob();
        const base64 = await convertFile(data);
        console.log(base64);
        const receiverId = Number('0x' + bs58.decode(receiver).toString('hex'));
        newMessages = [
          {
            image: base64,
            createdAt: new Date(),
            user: {
              _id: receiverId,
              name: receiver,
              avatar: 'https://placeimg.com/140/140/any',
            },
            _id: Math.round(Math.random() * 1000000),
          },
        ];
      }
      this.setState(previousState => {
        return {
          messages: previousState.messages.concat(newMessages),
        };
      });
    });
    // get receiver publickey
    // ws.emit('publicKey', JSON.stringify({publicKey: afid, username: addr}));

    // const httphost = `http://${host}`;
    // const body = new FormData();
    // body.append('token', token);
    // body.append('message', publicKey);
    // const res = await fetch(`${host1}/msg/upload`, {
    //   method: 'post',
    //   body,
    // });
    // const data = await res.json();
    // console.log(data);
    // const isSuccess = data.SuccStatus > 0;
    // if (!isSuccess) return;
    // const afid = data.Afid;

    this._isMounted = true;
    // init with only system messages
    this.setState({
      messages: messagesData.filter(message => message.system),
      appIsReady: true,
      userInfo,
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
    g.getFriendList();
  }

  onLoadEarlier = () => {
    this.setState(previousState => {
      return {
        isLoadingEarlier: true,
      };
    });
  };

  onSend = async (messages = []) => {
    const receiver = this.props.navigation.getParam('receiver');
    console.log(messages);
    const step = this.state.step + 1;

    // get userInfo
    const {userInfo} = this.state;
    const {token, addr, publicKey, privateKey} = userInfo;

    const body = new FormData();
    body.append('token', token);
    const text = messages[0].text;
    const cipher = CryptoJS.AES.encrypt(text, this.state.AESKEY).toString();
    const content = JSON.stringify({
      ph: this.state.encryptedAESKEY,
      cipher,
    });
    body.append('message', content);
    // body.append("message", this.refs.input.state.value);
    const res = await fetch(`${host1}/msg/upload`, {
      method: 'post',
      body,
    });
    const data = await res.json();
    const isSuccess = data.SuccStatus > 0;
    if (!isSuccess) return;
    const afid = data.Afid;
    this.state.ws.emit(
      'chat',
      JSON.stringify({
        sender: addr,
        receiver,
        data: afid,
      }),
    );
    const userId = Number('0x' + bs58.decode(addr).toString('hex'));
    console.log('userid' + userId);
    this.setState(previousState => {
      const sentMessages = [
        {
          text,
          createdAt: new Date(),
          user: {
            _id: userId,
            name: addr,
            avatar: 'https://placeimg.com/140/140/any',
          },
          _id: Math.round(Math.random() * 1000000),
        },
      ];
      return {
        messages: previousState.messages.concat(sentMessages),
        step,
      };
    });
    // for demo purpose
    // setTimeout(() => this.botSend(step), Math.round(Math.random() * 1000));
  };

  parsePatterns = linkStyle => {
    return [
      {
        pattern: /#(\w+)/,
        style: {textDecorationLine: 'underline', color: 'darkorange'},
        onPress: () => Linking.openURL('http://gifted.chat'),
      },
    ];
  };

  onSendFromUser = async (messages = []) => {
    const receiver = this.props.navigation.getParam('receiver');
    console.log('---');
    console.log(messages);
    const createdAt = new Date();
    // upload file
    const {userInfo} = this.state;
    const {token, addr, publicKey, privateKey} = userInfo;
    const body = new FormData();
    body.append('token', token);
    const file = messages[0].file;
    body.append('file', {
      name: file.fileName,
      type: file.type,
      uri:
        Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
    });
    Object.keys(file).forEach(key => {
      body.append(key, body[key]);
    });

    const userId = Number('0x' + bs58.decode(addr).toString('hex'));
    this.setState(previousState => {
      const sentMessages = [
        {
          image: messages[0].uri,
          user: {
            _id: userId,
            name: addr,
            avatar: 'https://placeimg.com/140/140/any',
          },
          createdAt,
          _id: Math.round(Math.random() * 1000000),
        },
      ];
      return {
        messages: previousState.messages.concat(sentMessages),
      };
    });
    const res = await fetch(`${host1}/file/upload`, {method: 'post', body});
    const data = await res.json();
    if (data.SuccStatus <= 0) return;
    const afid = data.Afid;
    this.state.ws.emit(
      'image',
      JSON.stringify({
        sender: addr,
        receiver,
        data: afid,
      }),
    );
  };

  renderAccessory = () => <AccessoryBar onSend={this.onSendFromUser} />;

  renderCustomActions = props => {
    return <CustomActions {...props} onSend={this.onSendFromUser} />;
  };

  renderBubble = props => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: '#f0f0f0',
          },
        }}
      />
    );
  };

  renderSystemMessage = props => {
    return (
      <SystemMessage
        {...props}
        containerStyle={{
          marginBottom: 15,
        }}
        textStyle={{
          fontSize: 14,
        }}
      />
    );
  };

  renderFooter = props => {
    if (this.state.typingText) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{this.state.typingText}</Text>
        </View>
      );
    }
    return null;
  };

  showModal = () => {
    this.setState({visible: true});
  };

  changeRemark = async () => {
    if (!this.state.userInfo) return;
    const receiver = this.props.navigation.getParam('receiver');
    await g.changeRemark(receiver, this.state.remark);
    await g.getFriendList();
    this.setState({visible: false});
  };

  render() {
    const footerButtons = [{text: 'Ok', onPress: () => this.changeRemark()}];
    const receiver = this.props.navigation.getParam('receiver');
    const {userInfo} = this.state;
    if (!userInfo) return null;
    curUserId = Number('0x' + bs58.decode(userInfo.addr).toString('hex'));
    console.log(curUserId);
    const curUser = {
      _id: curUserId,
      name: userInfo.addr,
    };
    const messages = [].concat(this.state.messages);
    return (
      <View
        style={styles.container}
        accessible
        accessibilityLabel="main"
        testID="main">
        <Provider>
          <Modal
            title="Change Remark"
            visible={this.state.visible}
            onClose={() => this.setState({visible: false})}
            closable
            transparent
            maskClosable
            footer={footerButtons}>
            <InputItem
              value={this.state.remark}
              onChange={e => this.setState({remark: e})}
              placeholder="Remark"
            />
          </Modal>
          <NavBar
            user={this.state.remark}
            addr={receiver}
            showModal={this.showModal}
          />

          <GiftedChat
            messages={messages.reverse()}
            onSend={this.onSend}
            loadEarlier={this.state.loadEarlier}
            onLoadEarlier={this.onLoadEarlier}
            isLoadingEarlier={this.state.isLoadingEarlier}
            parsePatterns={this.parsePatterns}
            user={curUser}
            keyboardShouldPersistTaps="never"
            renderAccessory={this.renderAccessory}
            renderActions={this.renderCustomActions}
            renderBubble={this.renderBubble}
            renderSystemMessage={this.renderSystemMessage}
            //   renderCustomView={this.renderCustomView}
            renderFooter={this.renderFooter}
          />
        </Provider>
      </View>
    );
  }
}
export default withNavigation(App);
