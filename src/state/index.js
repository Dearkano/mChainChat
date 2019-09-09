import {
    Provider,
    Subscribe,
    Container
} from 'unstated'


class GlobalState extends Container {
    state = {
        userInfo: null,
        friendList: [],
        messageList: [],
        ws: null,
        host: '',
        afsHost: 'http://183.178.144.228:8100'
    }

    login = userInfo => this.setState({
        userInfo
    })

    setKeys = e => this.setState({
        selectedKeys: [e]
    })

    getFriendList = async () => {
        const {
            afsHost,
            userInfo,
            host
        } = this.state

        // get message from message node
        const mRes = await fetch(`http://${host}/getMessageList?addr=${userInfo.addr}`)
        const mData = await mRes.json()

        let res = await fetch(`${afsHost}/afid/getbytag?token=${userInfo.token}&tag=ChainChat::FriendList-${userInfo.addr}`)
        let data = await res.json()
        if (data.SuccStatus <= 0) return
        let newFriendList = []
        if (!data.Afids || data.Afids.length === 0) {

        } else {
            const afid = data.Afids[0].Afid
            res = await fetch(`${afsHost}/msg/download?afid=${afid}&token=${userInfo.token}`)
            data = await res.json()
            if (data.SuccStatus <= 0) return
            newFriendList = JSON.parse(data.Message)
        }

        const set = new Set()
        for (const item of newFriendList) {
            set.add(item.addr)
        }
        for (const item of mData) {
            if (!set.has(item.sender)) {
                set.add(item.sender)
                newFriendList = newFriendList.concat({
                    addr: item.sender,
                    remark: 'stranger'
                })
            }
        }

        const newMessageList = []
        for (const item of newFriendList) {
            const mes = mData.filter(m => m.addr = item.addr)
            const obj = {
                ...item,
                messages: mes
            }
            newMessageList.push(obj)
        }
        this.setState({
            friendList: newFriendList,
            messageList: newMessageList
        })
    }

    addFriend = async e => {
        const {
            afsHost,
            userInfo,
            friendList,
            host
        } = this.state
        const newFriendList = _.unionBy(friendList, [e], 'addr')
        console.log(friendList)
        console.log(e)
        console.log(newFriendList)
        console.log('add friend')

        // get current friend list by tag
        let res = await fetch(`${afsHost}/afid/getbytag?token=${userInfo.token}&tag=ChainChat::FriendList-${userInfo.addr}`)
        let data = await res.json()
        if (data.SuccStatus <= 0) return
        // if the user's friendlist not exists
        if (!data.Afids || data.Afids.length === 0) {
            //
        } else {
            const afid = data.Afids[0].Afid
            let body = new FormData()
            body.append('token', userInfo.token)
            body.append('afid', afid)
            res = await fetch(`${afsHost}/afid/remove`, {
                method: 'post',
                body
            })
            data = await res.json()
            if (data.SuccStatus <= 0) return
        }

        // upload new friend list
        let body = new FormData()
        let str = JSON.stringify(newFriendList)
        body.append('token', userInfo.token)
        body.append('message', str)
        res = await fetch(`${afsHost}/msg/upload`, {
            method: 'post',
            body
        })
        data = await res.json()
        if (data.SuccStatus <= 0) return
        const newFriendListAfid = data.Afid

        // add afid
        body = new FormData()
        body.append('token', userInfo.token)
        body.append('afid', newFriendListAfid)
        res = await fetch(`${afsHost}/afid/add`, {
            method: 'post',
            body
        })
        data = await res.json()
        if (data.SuccStatus <= 0) return

        // add tag
        body = new FormData()
        body.append('token', userInfo.token)
        body.append('tag', `ChainChat::FriendList-${userInfo.addr}`)
        body.append('afid', newFriendListAfid)
        res = await fetch(`${afsHost}/afid/addtag`, {
            method: 'post',
            body
        })

        data = await res.json()
        if (data.SuccStatus <= 0) return

        const mRes = await fetch(`http://${host}/getMessageList?addr=${userInfo.addr}`)
        const mData = await mRes.json()
        const newMessageList = []
        for (const item of newFriendList) {
            const mes = mData.filter(m => m.addr = item.addr)
            const obj = {
                ...item,
                messages: mes
            }
            newMessageList.push(obj)
        }
        this.setState({
            friendList: newFriendList,
            messageList: newMessageList
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