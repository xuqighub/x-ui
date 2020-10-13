!function(){
    class Progress{
        constructor({mountEl,percent=0,color,stripes = true,stripesMove = true}){
            //挂载的元素节点
            this.mountEl = mountEl;
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
            //初始化
            this.init();
        }
        //创建进度条元素
        createProgressEl = (percent)=>{
            let template = `
                <div class="xui-progress ${this.stripes ? 'xui-progress-stripes' : ''} ${this.stripesMove ? 'ui-progress-stripesMove' : ''}" style="--percent:${percent}%">
                    <div class="xui-progress-bar" style="background-color:${this.color}">${percent}%</div>
                </div>
            `;
            let temp = document.createElement('div');
            temp.innerHTML = template;
            return temp.firstElementChild; 
        }
        //挂载进度条到目标节点
        init = ()=>{
            this.progressEl = this.createProgressEl(this.percent);
            this.mountEl.appendChild(this.progressEl);
        }
        //将进度条置为失败状态
        failed = ()=>{
            this.progressEl.classList.add('xui-failed-status');
        }
        //更新进度条的进度，传入一个数值
        update = (percent)=>{
            percent = percent >= 100 ? 100 : percent;
            percent += '%';
            this.progressEl.querySelector('.xui-progress-bar').textContent = percent;
            this.progressEl.style.setProperty('--percent',percent);
        }
    }

    var progress = {};
    progress.render = function(obj){
        return new Progress(obj);
    }
    window.progress = progress;
}()