import {
    Provider,
    Subscribe,
    Container
} from 'unstated'


class GlobalState extends Container {
    state = {
        userInfo: null,
        friendList: [],
        ws: null,
        host: ''
    }

    login = userInfo => this.setState({
        userInfo
    })

    setKeys = e => this.setState({
        selectedKeys: [e]
    })

    addFriend = e => {
        console.log('add friend')
        this.setState({
            friendList: this.state.friendList.concat(e)
        })
    }

    setWs = e => this.setState({
        ws: e
    })

    setHost = e => this.setState({
        host: e
    })
}

const g = new GlobalState()
export default g