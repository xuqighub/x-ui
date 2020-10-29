!function(window){
    class Modal {
        constructor({
            content,
            //打开后自动隐藏掉，默认时间是300ms
            autoFade,
            layerClose = true,
            mask = true,
            header,
            width,
            footer,
            className,
        }) {

            //填充内容,可以使elemet对象，也可以是字符串格式
            if(typeof content === 'object'){
                this.content = content;
            }else if(typeof content === 'string'){
                if(content.indexOf('.') === 0 || content.indexOf('#') === 0){
                    this.content = document.querySelector(content);
                }else {
                    this.content = content;
                }
            }
            //打开后自动隐藏掉，默认时间是300ms
            this.autoFade = autoFade ? (typeof autoFade === "number" ? autoFade : 1600) : false;
            //modal container对象
            this.container = null;
            //点击空白处是否可以关闭modal
            this.layerClose = layerClose;
            //是否显示mask
            this.mask = mask;
            //header
            this.header = header;
            //footer
            this.footer = footer;
            //modal宽度
            this.width = width;
            //可以给一个className，以便可以更改某些样式（增加权重）
            this.className = className;
            //初始化
            this.init();
        }
        //初始化
        init = () => {
            let container = this.containerEl();
            if (typeof this.content === 'object') {
                //如果是传入的html元素
                this.content.style.display = 'block';
                container.querySelector('.xui-modal-body').appendChild(this.content);
            } else if (this.content) {
                //如果传入的string元素
                container.querySelector('.xui-modal-body').innerHTML = this.content;
            }
            //将弹出层插入body中
            this.container = container;
            document.querySelector('body').appendChild(container);
    
            //初始化事件
            this.initEvent();
        }
        //生成container
        containerEl = () => {
            let {
                header,
                footer,
                width,
                className
            } = this;
            let mHeader = `
                <div class="xui-modal-header ${header?.draggable ? 'xui-modal-drag' : ''}">
                    <div class="xui-modal-title">
                        <div>${header?.title ? header?.title : ''}</div>
                    </div>
                    <button class="xui-modal-close">
                        <svg viewBox="64 64 896 896" focusable="false" class="" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
                        </svg>
                    </button>
                </div>`;
            let mFooter = `
                <div class="xui-modal-footer">
                    ${Array.isArray(footer) 
                        ? footer.map((item,index)=>`<button class="xui-modal-footer-button modal-btn${index}">${item}</button>`).join('')
                        : (typeof footer === "object" 
                            ?  `<button class="xui-modal-footer-button xui-modal-btn-cancel">${footer.cancelText}</button>
                                <button class="xui-modal-footer-button xui-modal-btn-confirm">
                                    ${footer.loading ? 
                                        `<span class="xui-modal-loading-icon-box">
                                            <span class="xui-modal-loading-icon"><svg viewBox="0 0 1024 1024" focusable="false" class="xui-modal-loading-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg></span>
                                        </span>` : ''}
                                    <span>${footer.okText}</span>
                                </button>`
                            : footer)
                    } 
                </div>
            `;
            let template = `
                <div class="xui-modal-container ${className ? className : ''}">
                    ${this.mask ? '<div class="xui-modal-mask"></div>' : ''}
                    <div class="xui-modal-box">
                        <div class="xui-modal-wrap">
                            <div class="xui-modal-content-box">
                                <div class="xui-modal-content" style="width:${width ? width + 'px;' : 'auto;'}">
                                    ${header ? mHeader : ''}
                                    <div class="xui-modal-body"></div>
                                    ${footer ? mFooter : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            let temp = document.createElement('div');
            temp.innerHTML = template;
            return temp.firstElementChild;
        }
        //为container 添加点击事件
        click = (callback) => {
            this.container.addEventListener('click', function (ev) {
                callback && callback.call(this, ev);
            })
        }
        //关于modal初始化的事件
        initEvent = () => {
            let {footer={},container,mask,layerClose,autoFade,hide,header} = this;
            let {onCancel,loading,onOk} = footer;
            //监听弹出和隐藏的animation事件
            container.addEventListener('animationend', (ev) => {
                if (ev.animationName === 'zoomIn') {
                    //移除进入动画类
                    ev.target.classList.remove('zoomIn');
                    //移除mask的动画进入类
                    mask && container.querySelector('.xui-modal-mask').classList.remove('fadeIn');
                } else if (ev.animationName === 'zoomOut') {
                    //移除弹出动画类
                    ev.target.classList.remove('zoomOut');
                    //移除mask弹出类
                    mask && container.querySelector('.xui-modal-mask').classList.remove('fadeOut');
                    //弹出后隐藏元素
                    container.classList.remove('ui-modal-show');
                    //如果有loading类删除loading类
                    container.classList.remove('xui-modal-loading');
                    //如果是拖拽则把拖拽重置
                    if(header?.draggable){
                        container.querySelector('.xui-modal-content').style.transform = '';
                    }
                }
            });
            //是否可拖拽
            if(header?.draggable){
                container.querySelector('.xui-modal-drag').onmousedown = function(ev){
                    let startX = ev.pageX,
                        startY = ev.pageY,
                        content =  container.querySelector('.xui-modal-content'),
                        //获取上一次的tranform中的值
                        transform = getComputedStyle(content).transform.substring(7).split(','),
                        prevX = transform[4] ? parseFloat(transform[4]) : 0,
                        prevY = transform[5] ? parseFloat(transform[5]) : 0;
                        //添加处于拖拽过程中的类
                        content.classList.add('xui-modal-dragging');
                    document.onmousemove = function(ev){
                        let disX = ev.pageX - startX;
                        let disY = ev.pageY - startY;
                        container.querySelector('.xui-modal-content').style.transform = `translate(${prevX+disX}px,${prevY+disY}px)`;
                    }
                    document.onmouseup = function(){
                        document.onmousemove = null;
                        document.onmouseup = null;
                        //移除处于拖拽过程中的类
                        content.classList.remove('xui-modal-dragging');
                        return false;
                    }
                }
            }
            //点击主体内容外面关闭弹出层
            container.addEventListener('click', (ev) => {
                if (ev.target.classList.contains('xui-modal-wrap')) {
                    //仅当允许点击mask是点击关闭，如果是自动隐藏则不能点击mask关闭
                    if (layerClose && !autoFade) {
                        hide();
                    }
                }
                //当有header时，点击close-btn 关闭弹出层,当有footer时，点击取消关闭弹出层
                if (ev.target.parentNode.classList.contains('xui-modal-close') || ev.target.classList.contains('xui-modal-close') || ev.target.parentNode.parentNode.classList.contains('xui-modal-close')) {
                    hide();
                }
                //当有默认footer,点击cancel,如果有onCancel则调用
                if (ev.target.classList.contains('xui-modal-btn-cancel')) {
                    onCancel && onCancel.call(this,hide);
                }
                //点击确认,当有xui-modal-loading类时不可点击
                if((ev.target.parentNode.classList.contains('xui-modal-btn-confirm') || ev.target.classList.contains('xui-modal-btn-confirm')) && !container.classList.contains('xui-modal-loading')){
                    loading && container.classList.add('xui-modal-loading');
                    onOk && onOk.call(this,hide);
                }
            })
        }
        //动画显示弹出层
        show = () => {
            //先将元素display:block
            this.container.classList.add('ui-modal-show');
            //为mask添加动画进入
            this.mask && this.container.querySelector('.xui-modal-mask').classList.add('fadeIn');
            //为主体内容添加动画进入
            this.container.querySelector('.xui-modal-content').classList.add('zoomIn');
    
            //如果是自动隐藏
            if (this.autoFade) {
                setTimeout(_ => {
                    this.hide();
                }, this.autoFade)
            }
        }
        //动画隐藏显示出
        hide = () => {
            //为mask添加动画弹出
            this.mask && this.container.querySelector('.xui-modal-mask').classList.add('fadeOut');
            //为主体内容添加动画弹出
            this.container.querySelector('.xui-modal-content').classList.add('zoomOut');
        }
    }
    
    Modal.containerEl = (config) => {
        let {title,content,type,okText,cancelText,loading,noFooter,width} = config;
        //不同的信息应该是不同的icon 
        let icon = function(type){
            switch(type){
                case 'confirm':
                    return `<svg viewBox="64 64 896 896" focusable="false" class="" data-icon="exclamation-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 688a48 48 0 1096 0 48 48 0 10-96 0zm24-112h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8z"></path></svg>`;
                case 'info':
                    return `<svg viewBox="64 64 896 896" focusable="false" class="" data-icon="info-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 336a48 48 0 1096 0 48 48 0 10-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path></svg>`;
                case 'success':
                    return `<svg viewBox="64 64 896 896" focusable="false" class="" data-icon="check-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0051.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z"></path><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>`;
                case 'error':
                    return `<svg viewBox="64 64 896 896" focusable="false" class="" data-icon="close-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M685.4 354.8c0-4.4-3.6-8-8-8l-66 .3L512 465.6l-99.3-118.4-66.1-.3c-4.4 0-8 3.5-8 8 0 1.9.7 3.7 1.9 5.2l130.1 155L340.5 670a8.32 8.32 0 00-1.9 5.2c0 4.4 3.6 8 8 8l66.1-.3L512 564.4l99.3 118.4 66 .3c4.4 0 8-3.5 8-8 0-1.9-.7-3.7-1.9-5.2L553.5 515l130.1-155c1.2-1.4 1.8-3.3 1.8-5.2z"></path><path d="M512 65C264.6 65 64 265.6 64 513s200.6 448 448 448 448-200.6 448-448S759.4 65 512 65zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>`
                default:
                    return `<svg viewBox="64 64 896 896" focusable="false" class="" data-icon="exclamation-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M464 688a48 48 0 1096 0 48 48 0 10-96 0zm24-112h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8z"></path></svg>`; 
            }
        }
        let template = `
            <div class="xui-modal-container">
                <div class="xui-modal-mask"></div>
                <div class="xui-modal-box">
                    <div class="xui-modal-wrap">
                        <div class="xui-modal-content xui-modal-${type}" style="width:${width ? width+'px' : '416px;'}">
                            <div class="xui-modal-body">
                                <div class="xui-modal-body-title">
                                    <span class="xui-modal-title-icon">
                                        ${icon(type)}
                                    </span>
                                    <span class="xui-modal-body-title-context">${title}</span>
                                </div>
                                <div class="xui-modal-body-content">${content ? content : ''}</div>
                                ${noFooter 
                                ? '' 
                                :   `<div class="xui-modal-footer">
                                        ${type === 'confirm' ? `<button class="xui-modal-footer-button xui-modal-btn-cancel">${cancelText}</button>` : ''}
                                        <button class="xui-modal-footer-button xui-modal-btn-confirm">
                                            ${loading ? 
                                                `<span class="xui-modal-loading-icon-box">
                                                    <span class="xui-modal-loading-icon"><svg viewBox="0 0 1024 1024" focusable="false" class="xui-modal-loading-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg></span>
                                                </span>` : ''}
                                            <span>${okText}</span>
                                        </button>
                                    </div>`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        let temp = document.createElement('div');
        temp.innerHTML = template;
        return temp.firstElementChild;
    }
    //关于modal初始化的事件
    Modal.initEvent = function({container,mask,layerClose,autoFade,onOk,onCancel,loading}){
        //弹出动画结束后就移除container元素
        container.addEventListener('animationend', (ev) => {
            if (ev.animationName === 'zoomIn') {
                //移除进入动画类
                ev.target.classList.remove('zoomIn');
                //移除mask的动画进入类
                mask && container.querySelector('.xui-modal-mask').classList.remove('fadeIn');
            }else if (ev.animationName === 'zoomOut') {
                document.body.removeChild(container);
            }
        });
        //点击主体内容外面关闭弹出层
        container.addEventListener('click', (ev) => {
            if (ev.target.classList.contains('xui-modal-wrap')) {
                //仅当允许点击mask是点击关闭，如果是自动隐藏则不能点击mask关闭
                if (layerClose && !autoFade) {
                    Modal.hide({container,mask});
                }
            }
            //当有header时，点击close-btn 关闭弹出层,当有footer时，点击取消关闭弹出层
            if (ev.target.classList.contains('xui-modal-close') || ev.target.classList.contains('xui-modal-btn-cancel')) {
                Modal.hide({container,mask});
                onCancel && onCancel();
            }
            //外部调用这个回调函数就关闭
            function hide(){
                Modal.hide({container,mask});
            }
            //点击确认,当有xui-modal-loading类时不可点击
            if((ev.target.parentNode.classList.contains('xui-modal-btn-confirm') || ev.target.classList.contains('xui-modal-btn-confirm')) && !container.classList.contains('xui-modal-loading')){
                loading && container.classList.add('xui-modal-loading');
                onOk ? onOk(hide) : Modal.hide({container,mask});
            }
        })
    }
    //显示
    Modal.show = function(config){
        let {container,autoFade,mask} = config;
        //先将元素display:block
        container.classList.add('ui-modal-show');
        //为mask添加动画进入
        mask && container.querySelector('.xui-modal-mask').classList.add('fadeIn');
        //为主体内容添加动画进入
        container.querySelector('.xui-modal-content').classList.add('zoomIn');
    
        //如果是自动隐藏
        if (autoFade) {
            setTimeout(_ => {
                Modal.hide({container,mask});
            }, autoFade)
        }
    }
    Modal.hide = function({container,mask}){
        //为mask添加动画弹出
        mask && container.querySelector('.xui-modal-mask').classList.add('fadeOut');
        //为主体内容添加动画弹出
        container.querySelector('.xui-modal-content').classList.add('zoomOut');
    }
    Modal.confirm = function({
        title,
        content,
        width,
        okText = "确认",
        cancelText = "取消",
        autoFade,
        loading,
        mask = true,
        layerClose = false,
        onCancel,
        onOk
    }){
        //生成结构插入页面底部
        let container = Modal.containerEl({title,content,type:'confirm',okText,cancelText,loading,width});
        document.querySelector('body').appendChild(container);
        //初始化事件
        Modal.initEvent({container,mask,layerClose,autoFade,onOk,onCancel,loading})
        //显示confirm框
        Modal.show({container,autoFade,mask});
    }
    //info
    Modal.info = function({
        title,
        content,
        width,
        okText = "我知道了",
        autoFade,
        loading,
        mask = true,
        layerClose = false,
        onOk
    }){
        //生成结构插入页面底部
        let container = Modal.containerEl({title,content,type:'info',okText,loading,width});
        document.querySelector('body').appendChild(container);
        //初始化事件
        Modal.initEvent({container,mask,layerClose,autoFade,onOk,loading})
        //显示模态框
        Modal.show({container,autoFade,mask});
    }
    //warning
    Modal.warning = function({
        title,
        content,
        width,
        okText = "我知道了",
        autoFade,
        loading,
        mask = true,
        layerClose = false,
        onOk
    }){
        //生成结构插入页面底部
        let container = Modal.containerEl({title,content,type:'warning',okText,loading,width});
        document.querySelector('body').appendChild(container);
        //初始化事件
        Modal.initEvent({container,mask,layerClose,autoFade,onOk,loading})
        //显示模态框
        Modal.show({container,autoFade,mask});
    }
    //error
    Modal.error = function({
        title,
        content,
        width,
        okText = "我知道了",
        autoFade,
        loading,
        mask = true,
        layerClose = false,
        onOk
    }){
        //生成结构插入页面底部
        let container = Modal.containerEl({title,content,type:'error',okText,loading,width});
        document.querySelector('body').appendChild(container);
        //初始化事件
        Modal.initEvent({container,mask,layerClose,autoFade,onOk,loading})
        //显示模态框
        Modal.show({container,autoFade,mask});
    }
    //success
    Modal.success = function({
        title,
        content,
        width,
        okText = "我知道了",
        autoFade,
        loading,
        mask = true,
        layerClose = false,
        onOk,
        noFooter,
    }){
        //生成结构插入页面底部
        let container = Modal.containerEl({title,content,type:'success',okText,loading,noFooter,width});
        document.querySelector('body').appendChild(container);
        //初始化事件
        Modal.initEvent({container,mask,layerClose,autoFade,onOk,loading})
        //显示模态框
        Modal.show({container,autoFade,mask});
    }
    var modal = {};
    modal.render = function(config){
        return new Modal(config);
    }
    window.modal = modal;
    window.Modal = Modal;
}(window);