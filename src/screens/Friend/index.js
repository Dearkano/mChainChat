import React from 'react';
import {ChatItem} from 'react-chainchat-elements/native';
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
import {
  List,
  Modal,
  Provider as AntdProvider,
  Popover,
  Drawer,
} from '@ant-design/react-native';
import {withNavigation} from 'react-navigation';
import Icons from 'react-native-vector-icons/AntDesign';
import g from '../../state';
import {Provider, Subscribe, Container} from 'unstated';
import QRCode from 'react-native-webview-qrcode';
const Item = List.Item;
const PopItem = Popover.Item;
const Brief = Item.Brief;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

class FriendList extends React.Component {
  state = {
    visible: false,
    drawer: false,
  };
  async componentDidMount() {
    await g.getFriendList();
    console.log(g.state);
  }
  showModal = () => {
    this.setState({visible: true});
  };
  render() {
    const footerButtons = [
      {text: 'Ok', onPress: () => this.setState({visible: false})},
    ];
    const {navigation} = this.props;
    const sidebar = (
      <ScrollView style={[styles.container]}>
        <List>
          <List.Item
            onPress={() => navigation.navigate('QrCode')}
            extra={<Icons name="scan1" size={20} color="#fff" />}>
            <Text>Add Friend</Text>
          </List.Item>
          <List.Item
            onPress={() => {
                navigation.navigate('LogIn')
                g.logout()
            }}
            extra={<Icons name="logout" size={20} color="#fff" />}>
            <Text>Logout</Text>
          </List.Item>
        </List>
      </ScrollView>
    );
    return (
      <AntdProvider>
        <Provider>
          <Drawer
            sidebar={sidebar}
            position="left"
            open={false}
            drawerRef={el => (this.drawer = el)}
            onOpenChange={this.onOpenChange}
            drawerBackgroundColor="#ccc">
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
                    footer={footerButtons}>
                    <QRCode value={G.state.userInfo.publicKey} size={250} />
                  </Modal>
                  <Header
                    leftComponent={
                      <Icons
                        onPress={() => this.drawer && this.drawer.openDrawer()}
                        name="menuunfold"
                        size={20}
                        color="#fff"
                      />
                    }
                    centerComponent={{
                      text: 'ChainChat',
                      style: {color: '#fff'},
                    }}
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
                      {G.state.messageList.map(item => {
                        const unread = item.messages.filter(
                          item => item.status === 'pending',
                        ).length;
                        return (
                          <Item
                            style={{border: 'none'}}
                            onPress={() => {
                              navigation.navigate('Chat', {
                                receiver: item.addr,
                                remark: item.remark,
                              });
                            }}>
                            <ChatItem
                              avatar={{uri: 'https://placeimg.com/140/140/any'}}
                              alt={'Reactjs'}
                              title={item.remark}
                              subtitle={''}
                              date={
                                item.messages.length === 0
                                  ? Date.now()
                                  : item.messages[item.messages.length - 1]
                                      .timestamp
                              }
                              unread={unread}
                            />
                          </Item>
                        );
                      })}
                    </List>
                  </ScrollView>
                </>
              )}
            </Subscribe>
          </Drawer>
        </Provider>
      </AntdProvider>
    );
  }
}
export default withNavigation(FriendList);
