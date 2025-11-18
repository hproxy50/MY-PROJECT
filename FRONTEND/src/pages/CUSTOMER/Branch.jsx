import "../../css/Branch.scss"
import logo from "../../assets/image/logo.png"
import image from "../../assets/image/branch.jpg"
export default function Branch(){
    return(
        <div className="branch">
            <div className="branch-body">
                <div className="branch-body-header">
                    <div className="branch-body-header-left">
                        <img src={logo} alt="LOGO" />
                    </div>
                    <div className="branch-body-header-mid">
                        <p className="branch-body-header-mid-title">Hung Snack Conner</p>
                    </div>
                    <div className="branch-body-header-right">
                        <p className="branch-body-header-right-hotline">Hotline: 0584299322</p>
                    </div>
                </div>
                <div className="branch-body-mid">
                    <div className="branch-body-mid-left">
                        <img src={image} alt="image" />
                    </div>
                    <div className="branch-body-mid-right">
                        <h1>Full range of today's most popular snacks</h1>
                        <p>
                            Hung Snack Conner is a chain of snack stores with a youthful and modern style, where you can easily find familiar dishes but with more attractive variations every day. We offer a variety of snacks, from fried foods, cakes, milk tea to popular street snacks. With a friendly, clean space and quick service, Hung Snack Conner hopes to become an ideal stop for everyone - from students to office workers. We are committed to the quality of ingredients, delicious flavors and reasonable prices, so that every visit is a fun and complete experience.
                        </p>
                        <div className="branch-body-mid-right-right2">
                            <button>Chi nhanh 1 duong dinh nghe</button>
                        </div>
                    </div>
                </div>
                <div className="branch-body-bottom">
                    .
                </div>
            </div>
        </div>
    )
} 