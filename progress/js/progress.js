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
            if(this.type === 'line'){
                this.progressEl.classList.add('xui-failed-status');
            }else if(this.type === 'circle'){
                this.progressEl.querySelector('.xui-progress-inner').style.setProperty('--color','#d9534f');
                this.progressEl.querySelector('.xui-progress-text').title = 'failed';
                this.progressEl.querySelector('.xui-progress-text').innerHTML = `
                    <svg style="color:#d9534f;" viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                        <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
                    </svg>
                `;
            }
        }
        //将进度条置为成功状态
        success = ()=>{
            //成功状态
            if(this.type === 'line'){
                this.progressEl.classList.add('xui-success-status');
            }else if(this.type === 'circle'){
                this.progressEl.querySelector('.xui-progress-inner').style.setProperty('--color','#52c41a');
                this.progressEl.querySelector('.xui-progress-text').title = 'success';
                this.progressEl.querySelector('.xui-progress-text').innerHTML = `
                    <svg style="color:#52c41a;" viewBox="64 64 896 896" focusable="false"  width="1em" height="1em" fill="currentColor" aria-hidden="true">
                        <path d="M912 190h-69.9c-9.8 0-19.1 4.5-25.1 12.2L404.7 724.5 207 474a32 32 0 00-25.1-12.2H112c-6.7 0-10.4 7.7-6.3 12.9l273.9 347c12.8 16.2 37.4 16.2 50.3 0l488.4-618.9c4.1-5.1.4-12.8-6.3-12.8z"></path>
                    </svg>
                `;
            }
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
                //过滤标签正则
                var re = /<[^<>]+>/g;
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
                            <span class="xui-progress-text" title="${textContent.replace(re, '')}">${textContent}</span>
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