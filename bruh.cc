#include <iostream>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <CallConv.Inc>

class Numero {
    public:
        int num;
        Numero(int n1) {
            this->num = n1;
        }

        Numero operator+(Numero const& n) {
            Numero res(0);

            res.num = num + n.num;

            return res;
        }

        void print() { std::cout << num << '\n'; }
};

void recorrer(int* arr, int length) {
    printf("%d", length);
    for (int i = 0; i < length; i++)
    {
        /* code */
    }
    
}

#define ARR_LEN(arr) sizeof(arr) / sizeof(arr[0])

struct Person {
    const char* nombre;
    const char* color_piel;
    unsigned char edad;
};

static void saludar(struct Person un_boludo, struct Person* un_boludo_referenciado) {
    std::cout << "Puntero de parametro pasado como referencia" << std::endl;
    std::cout << un_boludo_referenciado << std::endl;


    std::cout << "Puntero de parametro" << std::endl;
    std::cout << &un_boludo << std::endl;
}

int main() {
    int arr[] = {1, 2, 3, 4, 5};

    struct Person juan;
    juan.nombre = "Juan";
    juan.edad = 10;

    saludar(juan, &juan);

    return 0;
}