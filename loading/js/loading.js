!function(window){
    class Loading{
        constructor(container,size){
            this.size = size;
            this.container = container;
            this.layer = null;
            this.init();
        }
        template = ()=>{
            let size = 'md';
            if(this.size === 'small'){
                size = 'sm';
            }else if(this.size === 'large'){
                size = 'lg';
            }
            let loadingElem = `
                <div class="xui-spin-container">
                    <div class="xui-spin xui-spin-spinning xui-spin-${size}">
                        <span class="xui-spin-dot xui-spin-dot-spin">
                            <i class="xui-spin-dot-item"></i>
                            <i class="xui-spin-dot-item"></i>
                            <i class="xui-spin-dot-item"></i>
                            <i class="xui-spin-dot-item"></i>
                        </span>
                    </div>
                </div>
            `;
            let layer = document.createElement('div');
            layer.innerHTML = loadingElem;
            layer.className = 'xui-spin-layer';
            return layer;
        }
        init = ()=>{
            let LoadingElem = this.template();
            this.container.appendChild(LoadingElem);
            this.layer = LoadingElem;
            return LoadingElem;
        }
        show = ()=>{
            this.layer.classList.add('xui-show');
        }
        hide = ()=>{
            this.layer.classList.remove('xui-show');
        }
    }

    var loading = {};
    loading.render = function(container,size){
        return new Loading(container,size);
    }

    window.loading = loading;
    
}(window)