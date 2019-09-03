import React from 'react';
import {ChatItem} from 'react-chat-elements/native';
import {
  StyleSheet,
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {Header} from 'react-native-elements';
import {List, Modal, Provider as AntdProvider} from '@ant-design/react-native';
import {withNavigation} from 'react-navigation';
import Icons from 'react-native-vector-icons/AntDesign';
import g from '../../state';
import {Provider, Subscribe, Container} from 'unstated';
import QRCode from 'react-native-webview-qrcode';
const Item = List.Item;
const Brief = Item.Brief;

class FriendList extends React.Component {
  state = {
    visible: false,
  };
  componentDidMount() {}
  showModal = () => {
    this.setState({visible: true});
  };
  render() {
    const footerButtons = [
        { text: 'Ok', onPress: () => this.setState({visible: false}) },
      ];
    const {navigation} = this.props;
    return (
      <AntdProvider>
        <Provider>
          <Subscribe to={[g]}>
            {G => (
              <>
                <Modal
                  title="My QRcode"
                  visible={this.state.visible}
                  onClose={() => this.setState({visible: false})}
                  closable
                  transparent
                  maskClosable
                  footer={footerButtons}
                  >
                  <QRCode value={G.state.userInfo.publicKey} size={250} />
                </Modal>
                <Header
                  leftComponent={
                    <Icons
                      onPress={() => navigation.navigate('QrCode')}
                      name="scan1"
                      size={20}
                      color="#fff"
                    />
                  }
                  centerComponent={{text: 'ChainChat', style: {color: '#fff'}}}
                  rightComponent={
                    <Icons
                      onPress={() => this.showModal()}
                      name="qrcode"
                      size={20}
                      color="#fff"
                    />
                  }
                  containerStyle={{
                    backgroundColor: '#3D6DCC',
                    height: 40,
                    paddingTop: 5,
                    paddingBottom: 5,
                  }}
                />
                <ScrollView
                  style={{flex: 1, backgroundColor: '#f5f5f9'}}
                  automaticallyAdjustContentInsets={false}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}>
                  <List renderHeader={'Friends'}>
                    {G.state.friendList.map(item => (
                      <Item
                        onPress={() => {
                          navigation.navigate('Chat', {
                            receiver: item.addr,
                          });
                        }}>
                        <ChatItem
                          avatar="https://placeimg.com/140/140/any"
                          alt={'Reactjs'}
                          title={item.remark}
                          subtitle={''}
                          date={new Date()}
                          unread={0}
                        />
                      </Item>
                    ))}
                    <Item onPress={() => console.log(2424)}>
                      <ChatItem
                        avatar={'https://placeimg.com/140/140/any'}
                        alt={'Reactjs'}
                        title={'Facebook'}
                        subtitle={'What are you doing?'}
                        date={new Date()}
                        unread={2}
                      />
                    </Item>
                    <Item>
                      <ChatItem
                        avatar={'https://placeimg.com/140/140/any'}
                        alt={'Reactjs'}
                        title={'ASTRI'}
                        subtitle={'What is the weather like today?'}
                        date={new Date()}
                        unread={7}
                      />
                    </Item>
                  </List>
                </ScrollView>
              </>
            )}
          </Subscribe>
        </Provider>
      </AntdProvider>
    );
  }
}
export default withNavigation(FriendList);
