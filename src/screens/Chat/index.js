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

const host = '139.159.244.231:8085';
const host1 = 'http://183.178.144.228:8100';
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
  };

  _isMounted = false;

  async componentDidMount() {
    console.log('in chat');
    const receiver = this.props.navigation.getParam('receiver');
    // get userInfo
    const value = await AsyncStorage.getItem('userInfo');
    const userInfo = JSON.parse(value);
    const {token, addr, publicKey, privateKey} = userInfo;
    // build websocket with kevin for demo

    const httphost = `http://${host}`;
    const body = new FormData();
    body.append('token', token);
    body.append('message', publicKey);
    const res = await fetch(`${host1}/msg/upload`, {
      method: 'post',
      body,
    });
    const data = await res.json();
    console.log(data);
    const isSuccess = data.SuccStatus > 0;
    if (!isSuccess) return;
    const afid = data.Afid;

    const wshost = `ws://${host}`;
    const query = `?sender=${encodeURIComponent(
      addr,
    )}&receiver=${encodeURIComponent(receiver)}`;
    console.log(wshost + query);
    const ws = io(wshost + query);
    const that = this;
    ws.on('connect', async function() {
      console.log('on connection');
      ws.emit('publicKey', JSON.stringify({publicKey: afid, username: addr}));
      // get receiver's publicKey
      const res1 = await fetch(
        `${httphost}/getPublicKey?username=${encodeURIComponent(receiver)}`,
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
      that.setState({ws, receiverPublicKey});
    });
    ws.on('historytest', str => console.log('history test' + str));
    ws.on('history', async str => {
      console.log('history');
      const data = JSON.parse(str);
      console.log(data);
      for (const item of data) {
        const res = await fetch(
          `${host1}/msg/download?token=${token}&afid=${item.afid}`,
        );
        const d = await res.json();
        const encrypt = new JsEncrypt();
        encrypt.setPublicKey(publicKey);
        encrypt.setPrivateKey(privateKey);
        const mes = encrypt.decrypt(d.Message);
        const receiverId = Number('0x' + bs58.decode(receiver).toString('hex'));
        const newMessages = [
          {
            text: mes,
            createdAt: new Date(),
            user: {
              _id: receiverId,
              name: receiver,
              avatar: 'https://placeimg.com/140/140/any',
            },
          },
        ];
        this.setState({
          messages: previousState.messages.concat(newMessages),
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
        const encrypt = new JsEncrypt();
        encrypt.setPublicKey(publicKey);
        encrypt.setPrivateKey(privateKey);
        const mes = encrypt.decrypt(d.Message);
        const receiverId = Number('0x' + bs58.decode(receiver).toString('hex'));
        newMessages = [
          {
            text: mes,
            createdAt: new Date(),
            user: {
              _id: receiverId,
              name: receiver,
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
  }

  onLoadEarlier = () => {
    this.setState(previousState => {
      return {
        isLoadingEarlier: true,
      };
    });

    setTimeout(() => {
      if (this._isMounted === true) {
        this.setState(previousState => {
          return {
            messages: GiftedChat.prepend(
              previousState.messages,
              earlierMessages,
            ),
            loadEarlier: false,
            isLoadingEarlier: false,
          };
        });
      }
    }, 1000); // simulating network
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
    const encrypt = new JsEncrypt();
    encrypt.setPublicKey(this.state.receiverPublicKey);
    const text = messages[0].text;
    const encryptedContent = encrypt.encrypt(text);
    body.append('message', encryptedContent);
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

  onQuickReply = replies => {
    console.log({replies});
    const createdAt = new Date();
    if (replies.length === 1) {
      this.onSend([
        {
          createdAt,
          _id: Math.round(Math.random() * 1000000),
          text: replies[0].title,
          user,
        },
      ]);
    } else if (replies.length > 1) {
      this.onSend([
        {
          createdAt,
          _id: Math.round(Math.random() * 1000000),
          text: replies.map(reply => reply.title).join(', '),
          user,
        },
      ]);
    } else {
      console.warn('replies param is not set correctly');
    }
  };

  renderQuickReplySend = () => <Text>{' custom send =>'}</Text>;

  render() {
    console.log(this.state.messages);
    const receiver = this.props.navigation.getParam('receiver');
    const remark = this.props.navigation.getParam('remark');
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
        <NavBar user={remark} />
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
          quickReplyStyle={{borderRadius: 2}}
        />
      </View>
    );
  }
}
export default withNavigation(App);
