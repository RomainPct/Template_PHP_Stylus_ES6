 export default class DeviceData {

    constructor() {
        this.screen = { width: null, height: null}
        this.updateScreenSize()
        this.pointer = { x: this.screen.width / 2, y: this.screen.height / 2, rX: 0, rY: 0 }
        window.addEventListener('resize', _ => this.updateScreenSize())
        window.addEventListener('mousemove', e => this.updatePointer(e))
    }

    updatePointer(_e) {
        this.pointer.x = _e.clientX
        this.pointer.y = _e.clientY
        this.pointer.rX = (this.pointer.x / this.screen.width) - 0.5
        this.pointer.rY = (this.pointer.y / this.screen.height) - 0.5
    }

    updateScreenSize() {
        this.screen.width = window.innerWidth
        this.screen.height = window.innerHeight
    }

}