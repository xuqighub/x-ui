!function(window){
    class Progress{
        constructor({mountEl,percent=0,color='#00A3F3',stripes = true,stripesMove = true,width,type = 'line',format}){
            //挂载的元素节点
            this.mountEl = typeof mountEl === 'object' ? mountEl : document.querySelector(mountEl);
            //初始化可以给一个进度
            this.percent = percent;
            //进度条北京颜色，也可以直接通过css设置
            this.color = color;
            //是否要有条纹，默认有，不需要的话设为false
            this.stripes = stripes;
            //条纹是否有移动效果
            this.stripesMove = stripesMove;
            //进度条对象
            this.progressEl = null;
            this.width = width;
            //自定义文字格式
            this.format = format;
            //进度条类型
            this.type = type;
            //初始化
            this.init();
        }
        //创建进度条元素
        createProgressEl = ()=>{
            let template = this.getStruct();
            let temp = document.createElement('div');
            temp.innerHTML = template;
            return temp.firstElementChild; 
        }
        //挂载进度条到目标节点
        init = ()=>{
            this.progressEl = this.createProgressEl(this.percent);
            this.mountEl && this.mountEl.appendChild(this.progressEl);
        }
        //将进度条置为失败状态
        failed = ()=>{
            this.progressEl.classList.add('xui-failed-status');
        }
        //更新进度条的进度，传入一个数值
        update = (percent)=>{
            percent = percent >= 100 ? 100 : percent;
            let textContent = typeof this.format === 'function' ? this.format(percent) : percent + '%';
            if(this.type==='line'){
                //如果是line形式的
                this.progressEl.querySelector('.xui-progress-bar').textContent = textContent;
                this.progressEl.style.setProperty('--percent',percent +'%');
            }else if(this.type === 'circle'){
                //如果是圆形的
                this.progressEl.querySelector('.xui-progress-text').textContent = textContent;
                this.progressEl.querySelector('.xui-progress-circle-path').style.strokeDasharray = `${Math.round(percent*295.31)/100}px, 295.31px`;
            }
        }
        //返回带有percent的progress结构，用于没有挂载点返回带percent的progress结构，（外部也是html结构）
        getStruct = ()=>{
            let textContent = typeof this.format === 'function' ? this.format(this.percent) : this.percent + '%'
            if(this.type === 'line'){
                return (`
                    <div class="xui-progress ${this.stripes ? 'xui-progress-stripes' : ''} ${this.stripesMove ? 'ui-progress-stripesMove' : ''}" style="--percent:${this.percent}%">
                        <div class="xui-progress-bar" style="background-color:${this.color}">${textContent}</div>
                    </div>
                `);
            }else if(this.type === 'circle'){
                return (`
                    <div class="xui-progress-circle" ${this.width ? `style="width: ${this.width}px; height:${this.width}px;"` : ''}>
                        <div class="xui-progress-inner" style="--color:${this.color ? this.color : '#1890ff'}">
                            <svg viewBox="0 0 100 100">
                                <path class="xui-progress-circle-trail" d="M 50,50 m 0,-47 a 47,47 0 1 1 0,94 a 47,47 0 1 1 0,-94" stroke-linecap="round" stroke-width="6" fill-opacity="0"
                                    style="stroke-dasharray: 295.31px, 295.31px; stroke-dashoffset: 0px; transition: stroke-dashoffset 0.3s ease 0s, stroke-dasharray 0.3s ease 0s, stroke 0.3s ease 0s, stroke-width 0.06s ease 0.3s;">
                                </path>
                                <path class="xui-progress-circle-path" d="M 50,50 m 0,-47 a 47,47 0 1 1 0,94 a 47,47 0 1 1 0,-94" stroke="" stroke-linecap="round" stroke-width="6" opacity="1" fill-opacity="0"
                                    style="stroke-dasharray:${Math.round(this.percent*295.31)/100}px, 295.31px; stroke-dashoffset: 0px; transition: stroke-dashoffset 0.3s ease 0s, stroke-dasharray 0.3s ease 0s, stroke 0.3s ease 0s, stroke-width 0.06s ease 0.3s;">
                                </path>
                            </svg>
                            <span class="xui-progress-text">${textContent}</span>
                        </div>
                    </div>
                `);
            }
        }
    }

    var progress = {};
    progress.render = function(obj){
        return new Progress(obj);
    }
    window.progress = progress;
}(window);